"use client";
import { Funnel, LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";
import CostumedSelect from "../costumed/CostumedSelect";

import { useTranslations } from "next-intl";
import { useLanguageStore } from "../../stores/useLanguageStore";

const FriendFilterInput = ({ data, onChange, onSubmit }) => {
  const languages = useLanguageStore((s) => s.languages);
  const t = useTranslations("Components.friendFilterInput");
  const [nativeLanguageSelection, setNativeLanguageSelection] = useState([]);
  const [learningLanguageSelection, setLearningLanguageSelection] = useState(
    []
  );

  useEffect(() => {
    setNativeLanguageSelection(languages);
    setLearningLanguageSelection(languages);
  }, []);

  useEffect(() => {}, [data]);

  return (
    <>
      <form
        action=""
        className="mb-4 bg-base-200 p-4 pt-2 rounded-card flex flex-col xl:flex-row items-end gap-6 xl:gap-4"
      >
        <div className="xl:flex-1 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("fullName.label")}</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={data.fullName}
                onChange={(e) => {
                  onChange({ ...data, fullName: e.target.value });
                }}
                className="input input-bordered w-full text-sm"
                placeholder={t("fullName.placeholder")}
                maxLength={50}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("nativeLanguage.label")}</span>
              </label>

              <CostumedSelect
                placeholder={t("nativeLanguage.placeholder")}
                options={nativeLanguageSelection}
                onSelect={(option) =>
                  onChange({ ...data, nativeLanguage: option })
                }
                defaultValue={data.nativeLanguage}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("learningLanguage.label")}
                </span>
              </label>

              <CostumedSelect
                placeholder={t("learningLanguage.placeholder")}
                options={learningLanguageSelection}
                onSelect={(option) =>
                  onChange({ ...data, learningLanguage: option })
                }
                defaultValue={data.learningLanguage}
              />
            </div>
          </div>
        </div>

        <div
          className="btn btn-primary flex gap-2 items-center w-full xl:w-auto xl:mt-0"
          disabled={false}
          onClick={onSubmit}
        >
          {/* <Search className="size-4" /> */}
          <Funnel className="size-4" />
          {true ? (
            <>{t("button.text")}</>
          ) : (
            <>
              <LoaderIcon className="animate-spin size-5" />
              {t("button.loadingText")}
            </>
          )}
        </div>
      </form>
    </>
  );
};

export default FriendFilterInput;
