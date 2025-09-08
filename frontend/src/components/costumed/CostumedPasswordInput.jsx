import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

function CostumedPasswordInput({
  data,
  setData,
  placeholder = "Nhập mật khẩu",
}) {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;

    if (typeof data === "object" && data !== null) {
      setData({ ...data, password: value });
    } else {
      setData(value);
    }
  };

  const passwordValue =
    typeof data === "object" && data !== null
      ? data.password ?? ""
      : data ?? "";

  return (
    <div className="relative group">
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className="input input-bordered w-full text-sm pr-10"
        value={passwordValue}
        onChange={handleChange}
      />
      <div
        className="absolute top-1/2 right-4 -translate-y-1/2 text-sm cursor-pointer"
        onClick={() => setShowPassword(!showPassword)}
      >
        {passwordValue.trim() ? (
          showPassword ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )
        ) : null}
      </div>
    </div>
  );
}

export default CostumedPasswordInput;
