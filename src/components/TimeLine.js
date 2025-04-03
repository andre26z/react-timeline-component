import React, { useState, useRef, useEffect } from 'react';
import {
	format,
	parse,
	differenceInDays,
	addDays,
	eachMonthOfInterval,
	startOfMonth,
	endOfMonth,
} from 'date-fns';
import { assignLanes } from '../utils/assignLanes';

const Timeline = ({ items }) => {
	const [lanes, setLanes] = useState([]);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [draggingItem, setDraggingItem] = useState(null);
	const [editingItem, setEditingItem] = useState(null);
	const [timelineItems, setTimelineItems] = useState(items);
	const [startDate, setStartDate] = useState(null);
	const [endDate, setEndDate] = useState(null);
	const [isResizing, setIsResizing] = useState(false);
	const [resizeDirection, setResizeDirection] = useState(null);
	const [dragStartX, setDragStartX] = useState(0);
	const [itemStartDate, setItemStartDate] = useState(null);
	const [itemEndDate, setItemEndDate] = useState(null);
	const [months, setMonths] = useState([]);
	const [hoveredItem, setHoveredItem] = useState(null);
	const timelineRef = useRef(null);
	const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

	// Check if the user is on a desktop
	useEffect(() => {
		const handleResize = () => {
			setIsDesktop(window.innerWidth >= 1024);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Calculate timeline boundaries
	useEffect(() => {
		if (items.length > 0) {
			const start = items.reduce(
				(min, item) => (item.start < min ? item.start : min),
				items[0].start
			);
			const end = items.reduce((max, item) => (item.end > max ? item.end : max), items[0].end);

			// Add some padding days
			const parsedStart = parse(start, 'yyyy-MM-dd', new Date());
			const parsedEnd = parse(end, 'yyyy-MM-dd', new Date());

			// Round to the beginning/end of month
			const roundedStart = startOfMonth(parsedStart);
			const roundedEnd = endOfMonth(parsedEnd);

			setStartDate(roundedStart);
			setEndDate(roundedEnd);

			// Generate months for header
			const monthsInRange = eachMonthOfInterval({
				start: roundedStart,
				end: roundedEnd,
			});

			setMonths(monthsInRange);
		}
	}, [items]);

	// Assign items to lanes
	useEffect(() => {
		if (timelineItems.length > 0 && startDate && endDate) {
			const lanesResult = assignLanes(timelineItems);
			setLanes(lanesResult);
		}
	}, [timelineItems, startDate, endDate]);

	const handleZoomIn = () => {
		setZoomLevel((prev) => Math.min(prev + 0.25, 3));
	};

	const handleZoomOut = () => {
		setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
	};

	const getColorForItem = (item) => {
		// Use the provided color palette
		const colors = {
			default: '#345995',
			highlight: '#e40066',
			secondary: '#eac435',
		};

		// Determine if the item is being dragged or hovered
		if (draggingItem?.id === item.id) {
			return colors.highlight;
		}

		if (hoveredItem?.id === item.id) {
			return 'rgba(52, 89, 149, 0.9)'; // Slightly transparent primary
		}

		return colors.default;
	};

	const getItemStyle = (item) => {
		if (!startDate || !endDate) return {};

		const itemStart = parse(item.start, 'yyyy-MM-dd', new Date());
		const itemEnd = parse(item.end, 'yyyy-MM-dd', new Date());

		const totalDays = differenceInDays(endDate, startDate) + 1;
		const itemStartDays = differenceInDays(itemStart, startDate);
		const itemDuration = differenceInDays(itemEnd, itemStart) + 1;

		const left = (itemStartDays / totalDays) * 100;
		const width = (itemDuration / totalDays) * 100;

		return {
			left: `${left}%`,
			width: `${Math.max(width, 3)}%`, // Ensure minimum width for very short items
			backgroundColor: getColorForItem(item),
			borderColor: '#eac435',
			borderWidth: '1px',
			borderStyle: 'solid',
			transition: draggingItem?.id === item.id ? 'none' : 'all 0.3s ease', // Smooth transitions when not dragging
		};
	};

	const handleItemMouseDown = (e, item, type) => {
		e.preventDefault();
		if (type === 'resize-left' || type === 'resize-right') {
			setIsResizing(true);
			setResizeDirection(type);
		} else {
			setIsResizing(false);
			setResizeDirection(null);
		}

		setDraggingItem(item);
		setDragStartX(e.clientX);
		setItemStartDate(parse(item.start, 'yyyy-MM-dd', new Date()));
		setItemEndDate(parse(item.end, 'yyyy-MM-dd', new Date()));
	};

	const handleMouseMove = (e) => {
		if (!draggingItem || !timelineRef.current) return;

		const timelineRect = timelineRef.current.getBoundingClientRect();
		const totalWidth = timelineRect.width;
		const totalDays = differenceInDays(endDate, startDate) + 1;
		const pixelsPerDay = totalWidth / totalDays;

		const deltaX = e.clientX - dragStartX;
		const daysDelta = Math.round(deltaX / pixelsPerDay);

		if (isResizing) {
			if (resizeDirection === 'resize-left') {
				const newStart = addDays(itemStartDate, daysDelta);
				if (newStart < parse(draggingItem.end, 'yyyy-MM-dd', new Date())) {
					setTimelineItems((prev) =>
						prev.map((item) =>
							item.id === draggingItem.id
								? { ...item, start: format(newStart, 'yyyy-MM-dd') }
								: item
						)
					);
				}
			} else if (resizeDirection === 'resize-right') {
				const newEnd = addDays(itemEndDate, daysDelta);
				if (newEnd > parse(draggingItem.start, 'yyyy-MM-dd', new Date())) {
					setTimelineItems((prev) =>
						prev.map((item) =>
							item.id === draggingItem.id ? { ...item, end: format(newEnd, 'yyyy-MM-dd') } : item
						)
					);
				}
			}
		} else {
			// Moving the entire item
			const newStart = addDays(itemStartDate, daysDelta);
			const newEnd = addDays(itemEndDate, daysDelta);

			setTimelineItems((prev) =>
				prev.map((item) =>
					item.id === draggingItem.id
						? {
								...item,
								start: format(newStart, 'yyyy-MM-dd'),
								end: format(newEnd, 'yyyy-MM-dd'),
						  }
						: item
				)
			);
		}
	};

	const handleMouseUp = () => {
		setDraggingItem(null);
		setIsResizing(false);
		setResizeDirection(null);
	};

	const handleDoubleClick = (item) => {
		setEditingItem(item);
	};

	const handleNameChange = (e, itemId) => {
		setTimelineItems((prev) =>
			prev.map((item) => (item.id === itemId ? { ...item, name: e.target.value } : item))
		);
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Enter') {
			setEditingItem(null);
		}
	};

	const renderMonthHeaders = () => {
		if (!months.length) return null;

		const totalDays = differenceInDays(endDate, startDate) + 1;

		return (
			<div className="absolute top-0 left-0 right-0 h-8 flex border-b border-gray-200">
				{months.map((month, index) => {
					const monthStart = month;
					const monthEnd =
						index < months.length - 1 ? new Date(months[index + 1].getTime() - 1) : endDate;

					const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
					const widthPercentage = (daysInMonth / totalDays) * 100;

					return (
						<div
							key={index}
							className="flex-shrink-0 border-r border-gray-200 h-full flex items-center justify-center text-xs text-gray-500"
							style={{ width: `${widthPercentage}%` }}
						>
							{format(month, 'MMMM yyyy')}
						</div>
					);
				})}
			</div>
		);
	};

	const renderTimelineGrid = () => {
		if (!months.length) return null;

		return (
			<div className="absolute top-8 left-0 right-0 bottom-0 flex">
				{months.map((month, index) => {
					const monthStart = month;
					const monthEnd =
						index < months.length - 1 ? new Date(months[index + 1].getTime() - 1) : endDate;

					const totalDays = differenceInDays(endDate, startDate) + 1;
					const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
					const widthPercentage = (daysInMonth / totalDays) * 100;

					const isEvenMonth = index % 2 === 0;

					return (
						<div
							key={index}
							className={`flex-shrink-0 h-full border-r border-gray-200 ${
								isEvenMonth ? 'bg-gray-50' : ''
							}`}
							style={{ width: `${widthPercentage}%` }}
						/>
					);
				})}
			</div>
		);
	};

	// Calculate lane height based on device type
	const laneHeight = isDesktop ? 60 : 48;

	if (timelineItems.length === 0 || !startDate || !endDate) {
		return <div className="p-4 text-gray-600">Loading timeline...</div>;
	}

	return (
		<div className="p-4 bg-white rounded-lg shadow-md">
			<div className="flex justify-between items-center mb-4">
				<div className="text-lg font-semibold text-[#345995]">
					Project Timeline ({format(startDate, 'MMM yyyy')} - {format(endDate, 'MMM yyyy')})
				</div>
				<div className="flex items-center space-x-2">
					<button
						onClick={handleZoomOut}
						className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded"
					>
						-
					</button>
					<span className="px-2 py-1 text-sm">{Math.round(zoomLevel * 100)}%</span>
					<button
						onClick={handleZoomIn}
						className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded"
					>
						+
					</button>
				</div>
			</div>

			<div
				className="relative border border-gray-300 rounded overflow-hidden"
				style={{
					height: `${Math.max(lanes.length * laneHeight + 16, isDesktop ? 400 : 200)}px`,
				}}
				ref={timelineRef}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
			>
				<div className="absolute top-0 left-0 right-0 bottom-0 overflow-x-auto">
					<div
						className="relative min-w-full h-full"
						style={{
							transform: `scaleX(${zoomLevel})`,
							transformOrigin: 'left',
							minWidth: '100%',
							height: '100%',
						}}
					>
						{/* Month headers */}
						{renderMonthHeaders()}

						{/* Background grid */}
						{renderTimelineGrid()}

						{/* Timeline items */}
						<div className="absolute top-8 left-0 right-0 bottom-0">
							{lanes.map((lane, laneIndex) => (
								<div
									key={laneIndex}
									className="relative mb-2"
									style={{
										height: `${laneHeight}px`,
										top: laneIndex * laneHeight,
									}}
								>
									{lane.map((item) => (
										<div
											key={item.id}
											className="absolute h-full rounded px-2 py-1 flex items-center justify-between cursor-move text-white text-sm whitespace-nowrap overflow-hidden shadow-md hover:shadow-lg"
											style={getItemStyle(item)}
											onMouseDown={(e) => handleItemMouseDown(e, item, 'move')}
											onDoubleClick={() => handleDoubleClick(item)}
											onMouseEnter={() => setHoveredItem(item)}
											onMouseLeave={() => setHoveredItem(null)}
										>
											<div
												className="absolute left-0 top-0 w-2 h-full bg-opacity-50 cursor-ew-resize rounded-l"
												onMouseDown={(e) => handleItemMouseDown(e, item, 'resize-left')}
											/>

											{editingItem?.id === item.id ? (
												<input
													type="text"
													value={item.name}
													onChange={(e) => handleNameChange(e, item.id)}
													onKeyDown={handleKeyDown}
													onBlur={() => setEditingItem(null)}
													className="w-full bg-transparent outline-none"
													autoFocus
												/>
											) : (
												<div className="truncate max-w-full">{item.name}</div>
											)}

											<div
												className="absolute right-0 top-0 w-2 h-full bg-opacity-50 cursor-ew-resize rounded-r"
												onMouseDown={(e) => handleItemMouseDown(e, item, 'resize-right')}
											/>
										</div>
									))}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="mt-4 text-sm text-gray-600">
				<p className="flex items-center">
					<span className="w-3 h-3 inline-block mr-2 bg-[#345995] rounded"></span>
					Timeline items - Double-click to edit name
				</p>
				<p className="mt-1">Drag to move items, or drag edges to resize</p>
			</div>
		</div>
	);
};

export default Timeline;
