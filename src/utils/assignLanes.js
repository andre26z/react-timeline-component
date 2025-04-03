/**
 * Takes an array of items and assigns them to lanes based on start/end dates.
 * @param {Array} items - Array of timeline items with start and end dates
 * @returns {Array} - Array of arrays containing items organized in lanes
 */
export function assignLanes(items) {
	const sortedItems = [...items].sort((a, b) => new Date(a.start) - new Date(b.start));

	const lanes = [];

	function assignItemToLane(item) {
		for (const lane of lanes) {
			if (new Date(lane[lane.length - 1].end) < new Date(item.start)) {
				lane.push(item);
				return;
			}
		}
		lanes.push([item]);
	}

	for (const item of sortedItems) {
		assignItemToLane(item);
	}

	return lanes;
}
