import React from 'react';
import Timeline from './components/TimeLine.js';
import timelineItems from './data/timelineItems';

function App() {
	return (
		<div className="max-w-6xl mx-auto p-4">
			<h1 className="text-3xl font-bold mb-6 text-[#345995]">Airtable Timeline</h1>
			<Timeline items={timelineItems} />
		</div>
	);
}

export default App;
