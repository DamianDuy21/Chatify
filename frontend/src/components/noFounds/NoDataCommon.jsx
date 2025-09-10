const NoDataCommon = ({ title, content, classNameTitle, classNameContent }) => {
  return (
    <div className="card bg-base-200 p-6 text-center">
      <h3 className={`font-semibold mb-2 ${classNameTitle}`}>{title}</h3>
      <p className={`text-base-content opacity-70 text-sm ${classNameContent}`}>
        {content}
      </p>
    </div>
  );
};

export default NoDataCommon;
