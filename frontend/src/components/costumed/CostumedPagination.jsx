import { ChevronLeft, ChevronRight } from "lucide-react";
import CommonRoundedButton from "../buttons/CommonRoundedButton";

const CommonPagination = ({ totalPages, currentPage, setCurrentPage }) => {
  const goTo = (p) => {
    const next = Math.max(1, Math.min(totalPages, p));
    if (next !== currentPage) setCurrentPage(next);
  };

  const renderPageNumbers = () => {
    const items = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <CommonRoundedButton
            key={i}
            onClick={() => goTo(i)}
            type={currentPage === i ? "primary" : "outline"}
          >
            {i}
          </CommonRoundedButton>
        );
      }
      return items;
    }

    items.push(
      <CommonRoundedButton
        key={1}
        onClick={() => goTo(1)}
        type={currentPage === 1 ? "primary" : "outline"}
      >
        1
      </CommonRoundedButton>
    );

    if (currentPage > 3) {
      items.push(
        <span key="start-ellipsis" className="px-2 select-none">
          …
        </span>
      );
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      items.push(
        <CommonRoundedButton
          key={i}
          onClick={() => goTo(i)}
          type={currentPage === i ? "primary" : "outline"}
        >
          {i}
        </CommonRoundedButton>
      );
    }

    if (currentPage < totalPages - 2) {
      items.push(
        <span key="end-ellipsis" className="px-2 select-none">
          …
        </span>
      );
    }

    items.push(
      <CommonRoundedButton
        key={totalPages}
        onClick={() => goTo(totalPages)}
        type={currentPage === totalPages ? "primary" : "outline"}
      >
        {totalPages}
      </CommonRoundedButton>
    );

    return items;
  };

  return (
    <div className="w-full flex justify-center mt-8 gap-2">
      <CommonRoundedButton
        onClick={() => goTo(currentPage - 1)}
        type="outline"
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </CommonRoundedButton>

      {renderPageNumbers()}

      <CommonRoundedButton
        onClick={() => goTo(currentPage + 1)}
        type="outline"
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </CommonRoundedButton>
    </div>
  );
};

export default CommonPagination;
