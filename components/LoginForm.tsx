"use client"; // This indicates that this file is a client-side module

import Image from "next/image"; // Importing the Image component from Next.js for handling images
import { useState, useRef, useEffect } from "react"; // Importing React hooks
import { Input } from "@/components/ui/input"; // Importing custom Input component
import { Label } from "@/components/ui/label"; // Importing custom Label component
import { useRouter } from "next/navigation"; // Importing the useRouter hook from Next.js for navigation
import { useToast } from "@/components/ui/use-toast"; // Importing custom toast hook for notifications
import axios from "axios"; // Importing axios for making HTTP requests

export default function LoginForm() {
  const [username, setUsername] = useState(""); // State for the username input
  const [password, setPassword] = useState(""); // State for the password input
  const usernameRef = useRef<HTMLInputElement>(null); // Ref for the username input field
  const passwordRef = useRef<HTMLInputElement>(null); // Ref for the password input field
  const router = useRouter(); // Hook for navigation
  const { toast } = useToast(); // Hook for showing toast notifications

  // Effect to focus the username input field when the component mounts
  useEffect(() => {
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);

  // Function to handle the login process
  const handleLogin = async () => {
    try {
      // Sending a POST request to the login API
      const response = await axios.post(
        "http://localhost/phpdata/login.php",
        { username, password }
      );

      console.log("Response:", response.data);

      // If login is successful
      if (response.data.status === "success") {
        // Show success toast
        toast({ title: "Login successful", variant: "success" });
        // Store user data in sessionStorage and localStorage
        sessionStorage.setItem("username", username);
        sessionStorage.setItem("fullname", response.data.fullname);
        sessionStorage.setItem("role", response.data.role);
        sessionStorage.setItem("shift", response.data.shift);
        sessionStorage.setItem("userId", response.data.id);
        localStorage.setItem("userId", response.data.id);

        // Navigate based on user role
        if (response.data.role === 0) {
          router.push(`/admin?username=${username}`);
        } else {
          resetForm(); // Reset the form
          router.push(`/pos?username=${username}`);
        }
      } else {
        // If login fails, show error toast and reset form
        resetForm();
        toast({
          title: "Login failed",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      // If an error occurs, show error toast and reset form
      resetForm();
      console.error("Error logging in:", error);
      toast({
        title: "Login failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to reset the form fields
  const resetForm = () => {
    setUsername("");
    setPassword("");
    setTimeout(() => {
      if (usernameRef.current) {
        usernameRef.current.focus();
      }
    }, 100); // Timeout to allow the UI to update
  };

  // Function to handle key press events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      if (
        document.activeElement === usernameRef.current &&
        passwordRef.current
      ) {
        passwordRef.current.focus();
      } else {
        handleLogin();
      }
    }
  };

  return (
    <div className="w-full h-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px] text-white">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6 p-9">
          <div className="grid gap-2 text-left pb-4">
            <h1 className="text-3xl font-bold text-blue-400">LOGIN</h1>
            <p className="text-balance text-blue-400">
              Enter your credentials below to login to your account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                className="w-full p-2 text-black bg-white rounded-md"
                ref={usernameRef}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyPress}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                className="w-full p-2 text-black bg-white rounded-md"
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                required
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-white">
        <Image
          src="/LOGO.jpg"
          alt="Gaisano Logo"
          width={700}
          height={700}
          className="object-contain"
        />
      </div>
    </div>
  );
}
