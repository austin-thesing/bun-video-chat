import React from "react";
import { useWebSocket } from "../../contexts/WebSocketContext";
import RoomList from "../rooms/RoomList";
import UserList from "../users/UserList";

const Sidebar: React.FC = () => {
  const { currentRoom } = useWebSocket();

  return (
    <div className="w-64 bg-white shadow-md flex flex-col">
      {/* Room List */}
      <div className="flex-1 border-b">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Rooms</h2>
        </div>
        <RoomList />
      </div>

      {/* User List */}
      <div className="flex-1">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Online Users</h2>
        </div>
        <UserList />
      </div>
    </div>
  );
};

export default Sidebar;