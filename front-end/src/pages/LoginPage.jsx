import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        // navigate('/joincreatemeeting');
        // return
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (response.ok) {
                navigate('/joincreatemeeting');
            } else {
                setError(data.error || 'An error occurred during login.');
            }
        } catch (err) {
            setError('An error occurred during login.');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
                <form onSubmit={handleLogin} className="space-y-4">
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
                    <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Login</button>
                </form>
                <div className="text-center mt-4">
                    <Link to="/register" className="text-blue-500 hover:underline">
                        I don't have an account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
