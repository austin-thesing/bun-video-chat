import React from 'react';
import RoomList from '../rooms/RoomList';
import UserList from '../users/UserList';

const Sidebar: React.FC = () => {
  return (
    <div className="w-full md:w-64 bg-card shadow-md flex flex-col h-full">
      {/* Room List */}
      <div className="flex-1 border-b min-h-0 flex flex-col">
        <div className="p-3 md:p-4 border-b flex-shrink-0">
          <h2 className="text-base md:text-lg font-semibold">Rooms</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <RoomList />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="p-3 md:p-4 border-b flex-shrink-0">
          <h2 className="text-base md:text-lg font-semibold">Online Users</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <UserList />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
