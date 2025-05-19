import sys
import json
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import base64
import io

# Use ResNet50 architecture as shown in the screenshot
def create_model(num_classes):
    # Load pretrained ResNet50
    model = models.resnet50(pretrained=True)
    
    # Modify final layer
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)
    
    return model

def process_image(image_data):
    try:
        # Handle potential padding in base64 data
        if ',' in image_data:
            # Extract only the base64 part if it has a data URL prefix
            image_data = image_data.split(',', 1)[1]
            
        # Convert base64 to PIL Image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Define the same transforms used during training with ResNet50
        transform = transforms.Compose([
            transforms.Resize((224, 224)),  # ResNet50 expects 224x224 images
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  # ImageNet normalization
        ])
        
        # Add batch dimension
        return transform(image).unsqueeze(0)
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise Exception(f"Failed to process image: {str(e)}")

def load_model():
    # Create the same ResNet50 architecture used for training
    model = create_model(num_classes=3)  # 3 classes: AD, CN, MCI
    
    import os
    # Print current working directory for debugging
    print("Current working directory:", os.getcwd())
    model_path = os.path.join(os.path.dirname(__file__), 'resnet50_alzheimer_model.pth')
    print("Looking for model at:", model_path)
    
    # Load the trained model weights
    # Using map_location to ensure it works without GPU
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    
    # Set model to evaluation mode
    model.eval()
    return model

def predict(image_tensor):
    model = load_model()
    
    # Send model input to device (CPU in this case)
    device = torch.device('cpu')
    model = model.to(device)
    image_tensor = image_tensor.to(device)
    
    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
        _, predicted = torch.max(outputs, 1)
        
    classes = ['AD', 'CN', 'MCI']  # Make sure this matches your model's output classes
    
    # Get probabilities for each class
    class_probabilities = {}
    for i, cls in enumerate(classes):
        class_probabilities[cls] = float(probabilities[i])
        
    return {
        'prediction': classes[predicted.item()],
        'probabilities': class_probabilities
    }

if __name__ == "__main__":
    try:
        # Read input data from command line argument
        data = json.loads(sys.argv[1])
        image_data = data.get('image', '')
        
        if not image_data:
            print(json.dumps({'error': 'No image data provided'}))
            sys.exit(1)
            
        # Process image and make prediction
        print("Processing image data...")
        image_tensor = process_image(image_data)
        
        print("Making prediction...")
        result = predict(image_tensor)
        
        # Return prediction with probabilities
        print(json.dumps({
            'prediction': result['prediction'],
            'probabilities': result['probabilities'],
            'success': True
        }))
        
    except json.JSONDecodeError as je:
        print(json.dumps({
            'error': f'Invalid JSON input: {str(je)}',
            'success': False
        }))
        sys.exit(1)
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        print(json.dumps({
            'error': str(e),
            'traceback': traceback_str,
            'success': False
        }))
        sys.exit(1)
