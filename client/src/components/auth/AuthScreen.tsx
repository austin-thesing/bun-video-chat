import React, { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthScreen: React.FC = () => {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex mb-6">
          <button
            onClick={() => setAuthMode("login")}
            className={`flex-1 py-2 px-4 text-center font-semibold ${
              authMode === "login"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-l-md transition-colors`}
          >
            Login
          </button>
          <button
            onClick={() => setAuthMode("register")}
            className={`flex-1 py-2 px-4 text-center font-semibold ${
              authMode === "register"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            } rounded-r-md transition-colors`}
          >
            Register
          </button>
        </div>

        <h1 className="text-2xl font-bold text-center mb-6">
          {authMode === "login" ? "Welcome Back" : "Create Account"}
        </h1>

        {authMode === "login" ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
};

export default AuthScreen;