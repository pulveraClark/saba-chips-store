import { useState } from "react";
import { loginUser } from "../assets/services/authService.js";

function Login(){

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSubmit = async(e)=>{
    e.preventDefault();

    const res = await loginUser({email,password});

    alert(res.message);
  };

  return(
    <div className="flex justify-center items-center h-screen">

      <form onSubmit={handleSubmit} className="bg-white p-8 shadow-md rounded w-80">

        <h2 className="text-2xl font-bold mb-4 text-center">
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="border w-full p-2 mb-3"
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border w-full p-2 mb-3"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button className="bg-blue-500 text-white w-full p-2">
          Login
        </button>

      </form>

    </div>
  );
}

export default Login;