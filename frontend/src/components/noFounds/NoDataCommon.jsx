const NoDataCommon = ({ title, content }) => {
  return (
    <div className="card bg-base-200 p-6 text-center">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-base-content opacity-70 text-sm">{content}</p>
    </div>
  );
};

export default NoDataCommon;
