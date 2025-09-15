const CountBadge = ({ count, hoverAble }) => {
  const displayCount = count > 99 ? "99+" : count;

  return (
    <div
      className={`btn btn-secondary size-8 p-0 min-w-0 min-h-0 rounded-card ${
        hoverAble ? "cursor-pointer" : "pointer-events-none"
      } text-sm flex items-center justify-center`}
    >
      <span className="relative -top-[0.5px]"> {displayCount}</span>
    </div>
  );
};

export default CountBadge;
