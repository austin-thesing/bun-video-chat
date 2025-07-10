import React, { useState } from "react";
import { useWebSocket } from "../../contexts/WebSocketContext";
import RoomItem from "./RoomItem";

const RoomList: React.FC = () => {
  const { rooms, joinRoom, currentRoom, createRoom } = useWebSocket();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  // For demo purposes, let's create some default rooms if none exist
  const defaultRooms = [
    { id: 1, name: "General", type: "group" as const, created_by: "system", created_at: Date.now() },
    { id: 2, name: "Random", type: "group" as const, created_by: "system", created_at: Date.now() },
    { id: 3, name: "Tech Talk", type: "group" as const, created_by: "system", created_at: Date.now() },
  ];

  const displayRooms = rooms.length > 0 ? rooms : defaultRooms;

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    createRoom(newRoomName.trim(), "group");
    setNewRoomName("");
    setShowCreateForm(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {displayRooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              isActive={currentRoom === room.id}
              onClick={() => joinRoom(room.id)}
            />
          ))}
        </div>
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