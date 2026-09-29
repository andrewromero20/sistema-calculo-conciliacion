export default function Icon({ name, size = 18 }) {
	const shapes = {
		calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
		calculator: <><rect x="5" y="2.5" width="14" height="19" rx="2" /><path d="M8 6h8M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 19h1M12 19h1M16 19h1" /></>,
		home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
		plus: <path d="M12 5v14M5 12h14" />,
		history: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5M12 7v5l3 2" /></>,
		user: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
		search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
		eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
		edit: <><path d="m4 16-.8 4.8L8 20l11.3-11.3a2.2 2.2 0 0 0-3.1-3.1L4 16Z" /><path d="m14.5 7.5 3 3" /></>,
		trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M9 7V4h6v3M6 7l1 14h10l1-14" /></>,
		arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
	};

	return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{shapes[name]}</svg>;
}
