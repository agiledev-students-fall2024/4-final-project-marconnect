import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (response.ok) {
                navigate('/joincreatemeeting');
            } else {
                setError(data.error || 'An error occurred during registration.');
            }
        } catch (err) {
            setError('An error occurred during registration.');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold text-center mb-6">Register</h1>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-gray-700">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <button className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">Register</button>
                </form>
                <div className="text-center mt-4">
                    <Link to="/login" className="text-green-500 hover:underline">
                        I have an account already
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
