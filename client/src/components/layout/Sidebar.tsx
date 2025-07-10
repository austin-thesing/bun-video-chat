import React from 'react';
import RoomList from '../rooms/RoomList';
import UserList from '../users/UserList';

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white shadow-md flex flex-col h-full">
      {/* Room List */}
      <div className="flex-1 border-b bg-white">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-semibold text-gray-800">Rooms</h2>
        </div>
        <div className="bg-white">
          <RoomList />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 bg-white">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-semibold text-gray-800">Online Users</h2>
        </div>
        <div className="bg-white">
          <UserList />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
