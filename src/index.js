import React from 'react';
import ReactDOM from 'react-dom/client';
import timelineItems from './data/timelineItems.js';
import Timeline from './components/TimeLine.js';
import './tailwind.css';

function App() {
	return (
		<div className="max-w-6xl mx-auto p-6 bg-[#151D2C] min-h-screen min-w-screen">
			<h1 className="text-3xl font-bold mb-6 text-[#345995]">Airtable Timeline</h1>
			<Timeline items={timelineItems} />
		</div>
	);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
