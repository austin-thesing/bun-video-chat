import React, { useState } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import RoomItem from './RoomItem';

const RoomList: React.FC = () => {
  const { rooms, joinRoom, currentRoom, createRoom } = useWebSocket();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  // Filter out rooms with null names and sort by creation date
  const displayRooms = rooms
    .filter((room) => room.name && room.name.trim() !== '')
    .sort((a, b) => {
      const dateA =
        typeof a.created_at === 'string'
          ? new Date(a.created_at).getTime()
          : a.created_at;
      const dateB =
        typeof b.created_at === 'string'
          ? new Date(b.created_at).getTime()
          : b.created_at;
      return dateB - dateA;
    });

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    createRoom(newRoomName.trim(), 'group');
    setNewRoomName('');
    setShowCreateForm(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {displayRooms.length > 0 ? (
          <div className="p-3 space-y-1">
            {displayRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={currentRoom === room.id}
                onClick={() => joinRoom(room.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-gray-500 text-sm">No rooms available</p>
            <p className="text-gray-400 text-xs mt-1">
              Create a room to get started!
            </p>
          </div>
        )}
      </div>

      {/* Create Room Form */}
      {showCreateForm && (
        <div className="p-4 border-t bg-gray-50">
          <form onSubmit={handleCreateRoom} className="space-y-2">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Room Button */}
      {!showCreateForm && (
        <div className="p-4 border-t">
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
          >
            + Create Room
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomList;
