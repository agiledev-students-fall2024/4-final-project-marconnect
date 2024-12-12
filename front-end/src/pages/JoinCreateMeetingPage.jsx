import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Plus, LogOut, Users, Clock, ChevronRight, X } from 'lucide-react';

const ActionButton = ({ text, color, onClick, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`${color} text-white p-4 sm:p-6 rounded-xl flex items-center justify-center hover:opacity-90 transition-all duration-200 hover:scale-105 w-full shadow-lg space-x-3`}
  >
    <Icon size={24} className="shrink-0" />
    <span className="text-base sm:text-lg font-medium">{text}</span>
  </button>
);

const JoinCreateMeetingPage = () => {
  const navigate = useNavigate();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [pastMeetings, setPastMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const jwtToken = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(jwtToken));
  const userId = localStorage.getItem('UUID');

  useEffect(() => {
    if (!jwtToken) {
      navigate('/login');
    }
    fetchPastMeetings();
  }, [jwtToken, navigate]);

  const handleLogout = () => {
    // Clear all auth-related items from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('UUID');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const handleCreateMeeting = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
          'UserId': userId
        }
      });
      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }
      const data = await response.json();
      navigate(`/meetings/${data.meetingId}`);
    } catch (error) {
      setError('Failed to create meeting. Please try again.');
    }
  };

  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    if (!meetingId.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/meeting/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'UserId': userId
        }
      });
      if (response.ok) {
        navigate(`/meetings/${meetingId}`);
      } else {
        setError('Meeting not found');
      }
    } catch (error) {
      setError('Failed to join meeting. Please try again.');
    }
  };

  const fetchPastMeetings = async () => {
    try {
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/meeting/past/list`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'UserId': userId
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch past meetings');
      }
      const data = await response.json();
      setPastMeetings(data);
    } catch (error) {
      setError('Failed to load past meetings');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
    {isLoggedIn ? (
      <div className="min-h-screen bg-gray-50 w-screen">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Meeting Dashboard</h1>
                <span className="text-sm sm:text-base text-gray-600">Welcome, {username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors w-full sm:w-auto justify-center"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="pt-[30vh] mx-auto px-6 py-8">
          <div className="pt-[50vh] grid grid-cols-1 md:pt-[10vh] md:grid-cols-2 gap-6 mx-auto mb-12">
            <ActionButton
              text="New Meeting"
              color="bg-[#1DA1F2]"
              onClick={handleCreateMeeting}
              icon={Plus}
            />
            <ActionButton
              text="Join Meeting"
              color="bg-[#1DA1F2]"
              onClick={() => setShowJoinForm(true)}
              icon={Users}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="mr-2" />
              Recent Meetings
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : pastMeetings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No past meetings found</div>
            ) : (
              <div className="space-y-2">
                {pastMeetings.map((meeting) => (
                  <button
                    key={meeting.meetingId}
                    onClick={() => navigate(`/meetings/${meeting.meetingId}`)}
                    className="w-full p-4 hover:bg-blue-50 rounded-xl transition-all duration-200 flex items-center justify-between group border border-gray-200 hover:border-blue-200"
                  >
                    <div className="flex flex-col items-start gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">Meeting</span>
                        <span className="text-lg font-mono font-medium text-blue-600">
                          {meeting.meetingId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-600">
                          Created: {new Date(meeting.createdAt).toLocaleString()}
                        </span>
                        {meeting.codeEditor && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                              {meeting.codeEditor.language}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                        Join
                      </span>
                      <ChevronRight 
                        size={20} 
                        className="text-blue-600 transform group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {showJoinForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Join Meeting</h2>
                  <button
                    onClick={() => {
                      setShowJoinForm(false);
                      setMeetingId('');
                      setError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleJoinMeeting} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter meeting ID"
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Join Meeting
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    ) : (
      <Navigate to="/login" />
    )}
    </>
  );
};

export default JoinCreateMeetingPage;