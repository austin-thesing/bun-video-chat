import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import ResponsiveContainer from '../ui/responsive-container';

const AuthScreen: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <ResponsiveContainer maxWidth="md" padding="md">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <div className="flex rounded-lg overflow-hidden mb-4">
              <Button
                onClick={() => setAuthMode('login')}
                variant={authMode === 'login' ? 'default' : 'secondary'}
                className="flex-1 rounded-none rounded-l-lg"
              >
                Login
              </Button>
              <Button
                onClick={() => setAuthMode('register')}
                variant={authMode === 'register' ? 'default' : 'secondary'}
                className="flex-1 rounded-none rounded-r-lg"
              >
                Register
              </Button>
            </div>
            <CardTitle className="text-center text-xl md:text-2xl">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {authMode === 'login' ? <LoginForm /> : <RegisterForm />}
          </CardContent>
        </Card>
      </ResponsiveContainer>
    </div>
  );
};

export default AuthScreen;
