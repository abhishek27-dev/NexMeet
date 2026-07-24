import React from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const router = useNavigate();

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>NexMeet</h2>
        </div>
        <div className="navlist">
          <p onClick={() => router("/home")}>Join as Guest</p>
          <p onClick={() => router("/auth")}>Register</p>
          <div onClick={() => router("/auth")} role="button">
            <p>Login</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div className="connect">
          <h1>
            <span className="highlight">Connect</span> Instantly,{" "}
            Collaborate Freely
          </h1>
          <p>
            High-quality video calls, real-time chat, and seamless screen
            sharing — all in one place. No downloads, just{" "}
            <strong style={{ color: "#6c63ff" }}>NexMeet</strong>.
          </p>
          <div role="button">
            <Link
              style={{ color: "white", textDecoration: "none", fontSize: "1rem" }}
              to="/auth"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
        <div>
          <img src="/nexmeet_hero.png" alt="NexMeet high-tech video conference" className="heroImg" />
        </div>
      </div>

      <div className="featuresStrip">
        <div className="featureChip"><span>🔒</span> End-to-End Secure</div>
        <div className="featureChip"><span>⚡</span> Ultra Low Latency</div>
        <div className="featureChip"><span>💬</span> Live Chat</div>
        <div className="featureChip"><span>🖥️</span> Screen Sharing</div>
        <div className="featureChip"><span>🌐</span> No Downloads</div>
      </div>
    </div>
  );
}
