import React from 'react';
import Timeline from './components/TimeLine';
import timelineItems from './data/timelineItems';

function App() {
	return (
		<div className="min-h-screen bg-gray-900">
			<Timeline items={timelineItems} />
		</div>
	);
}

export default App;
