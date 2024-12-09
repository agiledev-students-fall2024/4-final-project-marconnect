import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ActionButton component definition
const ActionButton = ({ text, color, onClick }) => (
  <button
    onClick={onClick}
    className={`${color} text-white p-6 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity w-full`}
  >
    <span className="text-lg font-medium">{text}</span>
  </button>
);

const JoinCreateMeetingPage = () => {
  const navigate = useNavigate();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [pastMeetings, setPastMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPastMeetings();
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  const handleCreateMeeting = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }
      const data = await response.json();
      navigate(`/meetings/${data.meetingId}`);
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Please try again.');
    }
  };

  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    if (!meetingId.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/meeting/${meetingId}`);
      if (response.ok) {
        navigate(`/meetings/${meetingId}`);
      } else {
        alert('Meeting not found');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      alert('Failed to join meeting. Please try again.');
    }
  };

  const fetchPastMeetings = async () => {
    try {
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/meeting/past/list`);
      if (!response.ok) {
        throw new Error('Failed to fetch past meetings');
      }
      const data = await response.json();
      setPastMeetings(data);
    } catch (error) {
      console.error('Error fetching past meetings:', error);
      setError('Failed to load past meetings');
    } finally {
      setLoading(false);
    }
  };

  const handlePastMeetingClick = (meetingId) => {
    navigate(`/meetings/${meetingId}`);
  };


  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Meeting Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-6">
          {/* Action buttons section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <ActionButton
              text="New Meeting"
              color="bg-orange-500"
              onClick={handleCreateMeeting}
            />
            <ActionButton
              text="Join Meeting"
              color="bg-blue-500"
              onClick={() => setShowJoinForm(true)}
            />
          </div>

          {/* Past Meetings Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Meetings</h2>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading past meetings...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-600">
                {error}
              </div>
            ) : pastMeetings.length === 0 ? (
              <div className="text-center py-4 text-gray-600">
                No past meetings found
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {pastMeetings.map((meeting) => (
                    <li key={meeting.meetingId}>
                      <button
                        onClick={() => handlePastMeetingClick(meeting.meetingId)}
                        className="w-full hover:bg-gray-50 p-4 text-left transition-colors duration-150"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              Meeting ID: {meeting.meetingId}
                            </p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(meeting.createdAt).toLocaleString()}
                            </p>
                            {meeting.codeEditor && (
                              <p className="text-sm text-gray-500">
                                Language: {meeting.codeEditor.language}
                              </p>
                            )}
                          </div>
                          <div className="text-blue-500">
                            <span>Create →</span>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Join Meeting Modal */}
        {showJoinForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Join Meeting</h2>
              <form onSubmit={handleJoinMeeting}>
                <div className="mb-4">
                  <label htmlFor="meetingId" className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting ID
                  </label>
                  <input
                    type="text"
                    id="meetingId"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter meeting ID"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinForm(false);
                      setMeetingId('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Join
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JoinCreateMeetingPage;