import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';

const CLIENT_ID = "442074444238-4foj1orau9djqud3kfjl2m5iuq0d2kki.apps.googleusercontent.com";
const REDIRECT_URI = 'http://localhost:3000';

const App = () => {
    const [qrState, setQrState] = useState('');
    const [email, setEmail] = useState(null);
    const [loginSuccess, setLoginSuccess] = useState(false);

    useEffect(() => {
        const fetchState = () => {
            axios.get('http://localhost:5000/qr-state')
                .then(response => setQrState(response.data.state))
                .catch(error => console.error('Error fetching QR state:', error));
        };
        fetchState();
        const interval = setInterval(fetchState, 1000);
        return () => clearInterval(interval);
    }, []);

    // Handle OAuth response
    useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const token = hashParams.get('access_token');
        if (token) {
            fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((response) => response.json())
                .then((data) => {
                    setEmail(data.email);
                    axios.post('http://localhost:5000/mark-attendance', { email: data.email })
                        .then(() => {
                            setLoginSuccess(true);
                        })
                        .catch(() => {
                            setLoginSuccess(false);
                        });
                })
                .catch(() => {
                    setLoginSuccess(false);
                });
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, []);

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile&state=${qrState}&prompt=consent`;

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">Dynamic QR Google Login</h1>
            {email ? (
                <div className="p-4 bg-white shadow-lg rounded-lg">
                    {loginSuccess ? (
                        <p className="text-green-700">Login successful! Attendance marked for {email}</p>
                    ) : (
                        <p className="text-red-700">Login failed or user not found in database.</p>
                    )}
                </div>
            ) : (
                <div className="p-4 bg-white shadow-lg rounded-lg">
                    <p className="mb-2">Scan this QR code to log in with Google:</p>
                    <QRCodeCanvas value={googleAuthUrl} size={256} />
                </div>
            )}
        </div>
    );
};

export default App;
