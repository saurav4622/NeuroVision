import styled from 'styled-components';

const Button = ({ isLoading }) => {
  return (
    <StyledWrapper>
      <button className={`Btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
        <span className="btn-glow"></span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  .Btn {    position: relative;
    width: 150px;
    height: 55px;
    border-radius: 45px;
    border: none;
    background-color: #1a2980;
    color: white;
    box-shadow: 0px 10px 10px rgba(38, 208, 206, 0.3) inset,
    0px 5px 10px rgba(5, 5, 5, 0.212),
    0px -10px 10px rgba(26, 41, 128, 0.7) inset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .Btn::before {
    width: 70%;
    height: 2px;
    position: absolute;
    background-color: rgba(38, 208, 206, 0.8);
    content: "";
    filter: blur(1px);
    top: 7px;
    border-radius: 50%;
  }

  .Btn::after {
    width: 70%;
    height: 2px;
    position: absolute;
    background-color: rgba(38, 208, 206, 0.2);
    content: "";
    filter: blur(1px);
    bottom: 7px;
    border-radius: 50%;
  }
  .Btn:hover:not(.loading) {
    animation: jello-horizontal 0.9s both;
  }
  .Btn.loading {
    background-color: rgba(26, 41, 128, 0.8);
    opacity: 0.8;
    cursor: not-allowed;
    animation: pulse 1.5s infinite;
  }

  .btn-glow {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: 45px;
    z-index: -1;
    background: transparent;
    box-shadow: 0 0 15px rgba(38, 208, 206, 0.5), 0 0 30px rgba(38, 208, 206, 0.3);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .Btn:hover .btn-glow {
    opacity: 1;
    animation: glow-pulse 1.5s infinite alternate;
  }

  @keyframes glow-pulse {
    0% { box-shadow: 0 0 15px rgba(38, 208, 206, 0.5), 0 0 30px rgba(38, 208, 206, 0.3); }
    100% { box-shadow: 0 0 20px rgba(38, 208, 206, 0.7), 0 0 40px rgba(38, 208, 206, 0.5); }
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0px 10px 10px rgba(38, 208, 206, 0.3) inset,
      0px 5px 10px rgba(5, 5, 5, 0.212),
      0px -10px 10px rgba(26, 41, 128, 0.7) inset;
    }
    50% {
      box-shadow: 0px 10px 10px rgba(38, 208, 206, 0.2) inset,
      0px 5px 10px rgba(5, 5, 5, 0.15),
      0px -10px 10px rgba(26, 41, 128, 0.5) inset;
    }
    100% {
      box-shadow: 0px 10px 10px rgba(38, 208, 206, 0.3) inset,
      0px 5px 10px rgba(5, 5, 5, 0.212),
      0px -10px 10px rgba(26, 41, 128, 0.7) inset;
    }
  }

  @keyframes jello-horizontal {
    0% {
      transform: scale3d(1, 1, 1);
    }

    30% {
      transform: scale3d(1.25, 0.75, 1);
    }

    40% {
      transform: scale3d(0.75, 1.25, 1);
    }

    50% {
      transform: scale3d(1.15, 0.85, 1);
    }

    65% {
      transform: scale3d(0.95, 1.05, 1);
    }

    75% {
      transform: scale3d(1.05, 0.95, 1);
    }

    100% {
      transform: scale3d(1, 1, 1);
    }
  }`;

export default Button;
