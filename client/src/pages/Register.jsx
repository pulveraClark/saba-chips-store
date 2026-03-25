import { useState } from "react";
import { registerUser } from "../assets/services/authService.js";

function Register() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await registerUser(form);

    alert(res.message);
  };

  return (
    <div className="flex justify-center items-center h-screen">

      <form onSubmit={handleSubmit} className="bg-white p-8 shadow-md rounded w-80">

        <h2 className="text-2xl font-bold mb-4 text-center">
          Register
        </h2>

        <input
          type="text"
          placeholder="Name"
          className="border w-full p-2 mb-3"
          onChange={(e)=>setForm({...form,name:e.target.value})}
        />

        <input
          type="email"
          placeholder="Email"
          className="border w-full p-2 mb-3"
          onChange={(e)=>setForm({...form,email:e.target.value})}
        />

        <input
          type="password"
          placeholder="Password"
          className="border w-full p-2 mb-3"
          onChange={(e)=>setForm({...form,password:e.target.value})}
        />

        <button className="bg-green-500 text-white w-full p-2">
          Register
        </button>

      </form>

    </div>
  );
}

export default Register;