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
	const [selectedItem, setSelectedItem] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const timelineRef = useRef(null);

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

	// Close modal with ESC key
	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key === 'Escape') {
				setShowModal(false);
			}
		};
		window.addEventListener('keydown', handleEsc);
		return () => {
			window.removeEventListener('keydown', handleEsc);
		};
	}, []);

	const handleZoomIn = () => {
		setZoomLevel((prev) => Math.min(prev + 0.25, 3));
	};

	const handleZoomOut = () => {
		setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
	};

	const getColorForItem = (item) => {
		// Color palette for dark theme
		const colors = {
			default: '#6366f1', // Indigo
			highlight: '#ec4899', // Pink
			secondary: '#f59e0b', // Amber
			blue: '#3b82f6',
			green: '#10b981',
			purple: '#8b5cf6',
			red: '#ef4444',
		};

		// Assign colors based on item type or ID to create visual variety
		const itemId = parseInt(item.id, 10);
		let baseColor = colors.default;

		// Distribute colors among items
		if (itemId % 5 === 0) baseColor = colors.purple;
		else if (itemId % 4 === 0) baseColor = colors.green;
		else if (itemId % 3 === 0) baseColor = colors.blue;
		else if (itemId % 2 === 0) baseColor = colors.secondary;

		// Determine if the item is being dragged or hovered
		if (draggingItem?.id === item.id) {
			return colors.highlight;
		}

		if (hoveredItem?.id === item.id) {
			return baseColor + 'dd'; // Add transparency
		}

		return baseColor;
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

		const isBeingDragged = draggingItem?.id === item.id;

		return {
			left: `${left}%`,
			width: `${Math.max(width, 3)}%`, // Ensure minimum width for very short items
			backgroundColor: getColorForItem(item),
			transition: isBeingDragged ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
			transform: hoveredItem?.id === item.id && !isBeingDragged ? 'translateY(-2px)' : 'none',
			boxShadow:
				hoveredItem?.id === item.id
					? '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
					: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
			zIndex: hoveredItem?.id === item.id || isBeingDragged ? 10 : 1,
		};
	};

	const handleItemMouseDown = (e, item, type) => {
		e.preventDefault();
		e.stopPropagation();

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

	const handleItemClick = (e, item) => {
		// Only trigger on simple clicks, not during drag/resize operations
		// Using a flag to track if we're in the middle of a drag operation
		if (!draggingItem && !isResizing && !e.target.classList.contains('resize-handle')) {
			e.stopPropagation();
			setSelectedItem(item);
			setShowModal(true);
		}
	};

	const handleModalClose = () => {
		setShowModal(false);
		setSelectedItem(null);
	};

	const renderMonthHeaders = () => {
		if (!months.length) return null;

		const totalDays = differenceInDays(endDate, startDate) + 1;

		return (
			<div className="absolute top-0 left-0 right-0 h-10 flex border-b border-gray-700">
				{months.map((month, index) => {
					const monthStart = month;
					const monthEnd =
						index < months.length - 1 ? new Date(months[index + 1].getTime() - 1) : endDate;

					const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
					const widthPercentage = (daysInMonth / totalDays) * 100;

					return (
						<div
							key={index}
							className="flex-shrink-0 border-r border-gray-700 h-full flex items-center justify-center text-sm text-gray-300"
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
			<div className="absolute top-10 left-0 right-0 bottom-0 flex">
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
							className={`flex-shrink-0 h-full border-r border-gray-700 ${
								isEvenMonth ? 'bg-gray-800/30' : ''
							}`}
							style={{ width: `${widthPercentage}%` }}
						/>
					);
				})}
			</div>
		);
	};

	const renderModal = () => {
		if (!selectedItem || !showModal) return null;

		const startDateObj = parse(selectedItem.start, 'yyyy-MM-dd', new Date());
		const endDateObj = parse(selectedItem.end, 'yyyy-MM-dd', new Date());
		const duration = differenceInDays(endDateObj, startDateObj) + 1;

		return (
			<div
				className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn"
				onClick={handleModalClose}
			>
				<div
					className="bg-gray-900 rounded-lg shadow-xl max-w-lg w-full p-6 mx-4 animate-scaleIn"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex justify-between items-start mb-4">
						<h3 className="text-xl font-bold text-white">{selectedItem.name}</h3>
						<button
							onClick={handleModalClose}
							className="text-gray-400 hover:text-white transition-colors"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<div className="space-y-4">
						<div>
							<div className="text-gray-400 text-sm">Duration</div>
							<div className="text-white">{duration} days</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<div className="text-gray-400 text-sm">Start Date</div>
								<div className="text-white">{format(startDateObj, 'MMM d, yyyy')}</div>
							</div>
							<div>
								<div className="text-gray-400 text-sm">End Date</div>
								<div className="text-white">{format(endDateObj, 'MMM d, yyyy')}</div>
							</div>
						</div>

						<div>
							<div className="text-gray-400 text-sm">Status</div>
							<div className="inline-block px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm mt-1">
								In Progress
							</div>
						</div>

						<div>
							<div className="text-gray-400 text-sm">Description</div>
							<div className="text-gray-200 mt-1">
								{selectedItem.description ||
									'This task involves working on ' +
										selectedItem.name +
										' according to the project timeline.'}
							</div>
						</div>
					</div>

					<div className="mt-6 flex justify-end space-x-3">
						<button
							className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
							onClick={handleModalClose}
						>
							Close
						</button>
					</div>
				</div>
			</div>
		);
	};

	if (timelineItems.length === 0 || !startDate || !endDate) {
		return <div className="p-4 text-gray-300">Loading timeline...</div>;
	}

	return (
		<div className="bg-gray-900 text-white rounded-lg shadow-lg">
			<style>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}
				@keyframes scaleIn {
					from {
						transform: scale(0.95);
						opacity: 0;
					}
					to {
						transform: scale(1);
						opacity: 1;
					}
				}
				.animate-fadeIn {
					animation: fadeIn 0.2s ease-out;
				}
				.animate-scaleIn {
					animation: scaleIn 0.3s ease-out;
				}
			`}</style>

			<div className="p-4">
				<div className="flex justify-between items-center mb-6">
					<div className="text-xl font-bold text-white">
						Project Timeline
						<span className="ml-3 text-sm font-normal text-gray-400">
							{format(startDate, 'MMM yyyy')} - {format(endDate, 'MMM yyyy')}
						</span>
					</div>
					<div className="flex items-center space-x-2">
						<button
							onClick={handleZoomOut}
							className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-l-md transition-colors"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
						<span className="px-3 py-2 bg-gray-800 text-gray-300 text-sm">
							{Math.round(zoomLevel * 100)}%
						</span>
						<button
							onClick={handleZoomIn}
							className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-r-md transition-colors"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					</div>
				</div>

				<div
					className="relative border border-gray-700 rounded-lg overflow-hidden bg-gray-850"
					style={{
						height: '600px',
						maxHeight: 'calc(100vh - 240px)',
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
								minHeight: lanes.length * 60 + 20, // Ensure enough height for all lanes
							}}
						>
							{/* Month headers */}
							{renderMonthHeaders()}

							{/* Background grid */}
							{renderTimelineGrid()}

							{/* Timeline items */}
							<div
								className="absolute top-10 left-0 right-0 bottom-0"
								style={{ minHeight: lanes.length * 60 + 20 }}
							>
								{lanes.map((lane, laneIndex) => (
									<div
										key={laneIndex}
										className="relative mb-1"
										style={{
											height: '56px',
											top: laneIndex * 60,
										}}
									>
										{lane.map((item) => (
											<div
												key={item.id}
												className="absolute h-full rounded-md px-3 py-2 flex items-center justify-between cursor-pointer text-white text-sm whitespace-nowrap overflow-hidden"
												style={getItemStyle(item)}
												onMouseDown={(e) => handleItemMouseDown(e, item, 'move')}
												onDoubleClick={() => handleDoubleClick(item)}
												onMouseEnter={() => setHoveredItem(item)}
												onMouseLeave={() => setHoveredItem(null)}
												onClick={(e) => handleItemClick(e, item)}
											>
												<div
													className="absolute left-0 top-0 w-3 h-full bg-black/20 cursor-ew-resize rounded-l-md resize-handle"
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
													<div className="truncate max-w-full font-medium">{item.name}</div>
												)}

												<div
													className="absolute right-0 top-0 w-3 h-full bg-black/20 cursor-ew-resize rounded-r-md resize-handle"
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

				<div className="mt-4 text-sm text-gray-400">
					<p className="flex items-center">
						<span className="w-3 h-3 inline-block mr-2 bg-indigo-500 rounded"></span>
						Click on timeline items to view details. Double-click to edit name.
					</p>
					<p className="mt-1">Drag to move items, or drag edges to resize.</p>
				</div>
			</div>

			{/* Modal */}
			{renderModal()}
		</div>
	);
};

export default Timeline;
