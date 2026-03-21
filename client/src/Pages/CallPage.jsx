// src/Pages/CallPage.jsx
// This page is opened in a new tab when a video call starts.
// It reads call parameters from sessionStorage and runs the WebRTC call.
// Add this route to your App.jsx: <Route path="/call" element={<CallPage />} />

import VideoCallPage from '../components/Dashboard/VideoCallPage';

export default function CallPage() {
  return <VideoCallPage />;
}