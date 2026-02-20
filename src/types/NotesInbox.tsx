import React, { useState } from 'react';

interface Note {
  id: number;
  title: string;
  content: string;
  timestamp: string;
}

const NotesInbox = () => {
  // Local state for demonstration
  const [notes, setNotes] = useState<Note[]>([
    { id: 1, title: 'Project Ideas', content: '1. AI Dashboard\n2. Analytics Tool', timestamp: '2 mins ago' },
    { id: 2, title: 'Meeting Notes', content: 'Discuss Q4 goals with the team.', timestamp: '1 hour ago' },
    { id: 3, title: 'Grocery List', content: '- Milk\n- Eggs\n- Bread', timestamp: 'Yesterday' },
  ]);

  const addNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'New Note',
      content: 'Start typing...',
      timestamp: 'Just now',
    };
    setNotes([newNote, ...notes]);
  };

  return (
    <aside className="fixed right-0 top-0 h-screen w-[320px] border-l border-gray-200 bg-white shadow-lg flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Notes Inbox</h2>
        <button
          onClick={addNote}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Add new note"
        >
          {/* Plus Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-12H4" />
          </svg>
        </button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.map((note) => (
          <NoteWidget key={note.id} note={note} />
        ))}
      </div>
    </aside>
  );
};

const NoteWidget = ({ note }: { note: Note }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2 overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            {/* Chevron Right Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span 
            className="font-medium text-gray-700 truncate text-sm select-none cursor-pointer" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {note.title}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 focus:outline-none"
          >
            {/* Ellipsis Vertical Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
              <div className="absolute right-0 mt-1 w-24 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1">
                <button className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Edit</button>
                <button className="block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-50">
          <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">{note.content}</p>
          <p className="text-[10px] text-gray-400 mt-2 text-right">{note.timestamp}</p>
        </div>
      )}
    </div>
  );
};

export default NotesInbox;