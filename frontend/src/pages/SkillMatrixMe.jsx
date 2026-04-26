import { useState, useCallback, useEffect, useMemo } from "react";
import LoadingIndicator from "../components/LoadingIndicator";
import { Link } from "react-router-dom";
import api from "../api";

import {
  PlusCircle,
  TrendingUp,
  RefreshCw,
  RotateCcw,
  Lightbulb,
  BookOpen,
  Sparkles,
  UserStar,
  HardHat,
  Filter,
  Search,
  Trophy,
  Award,
  Users,
  Star,
  Zap,
} from "lucide-react";

const MySkillsPage = () => {
  const [mySkills, setMySkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filterByCategory, setFilterByCategory] = useState("all");

  const fetchMySkills = useCallback(() => {
    if (!refreshing) setLoading(true);
    api
      .get("api/skill-matrix/")
      .then((res) => setMySkills(res.data.results || res.data))
      .catch(() => alert("Failed to fetch your skills."))
      .finally(() => {
        setLoading(false);
        if (refreshing) setRefreshing(false);
      });
  }, [refreshing]);

  useEffect(() => fetchMySkills(), [fetchMySkills]);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  useEffect(() => {
    if (refreshing) fetchMySkills();
  }, [refreshing, fetchMySkills]);

  const resetFiltersHandler = () => {
    setSearchTerm("");
    setFilterByCategory("all");
  };

  const getCategoryIcon = (category) => {
    const iconProps = { size: 16, className: "mr-2" };
    switch (category) {
      case "TECHNICAL":
      case "MECHANICAL":
      case "ELECTRICAL":
        return (
          <HardHat
            {...iconProps}
            className={`${iconProps.className} text-orange-400`}
          />
        );
      case "SOFTWARE":
        return (
          <Lightbulb
            {...iconProps}
            className={`${iconProps.className} text-blue-400`}
          />
        );
      case "MANAGEMENT":
        return (
          <Users
            {...iconProps}
            className={`${iconProps.className} text-green-400`}
          />
        );
      default:
        return (
          <BookOpen
            {...iconProps}
            className={`${iconProps.className} text-stone-400`}
          />
        );
    }
  };

  const uniqueCategories = useMemo(
    () => [...new Set(mySkills.map((s) => s.category))],
    [mySkills]
  );

  const filteredSkills = useMemo(() => {
    return mySkills.filter((skill) => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        skill.name.toLowerCase().includes(searchTermLower) ||
        (skill.description &&
          skill.description.toLowerCase().includes(searchTermLower));

      const matchesCategory =
        filterByCategory === "all" || skill.category === filterByCategory;

      return matchesSearch && matchesCategory;
    });
  }, [mySkills, searchTerm, filterByCategory]);

  const getLevelPill = (level) => {
    const styles = {
      EXPERT: "bg-green-200 text-green-800",
      ADVANCED: "bg-blue-200 text-blue-800",
      INTERMEDIATE: "bg-yellow-200 text-yellow-800",
      BEGINNER: "bg-orange-200 text-orange-800",
    };

    const icons = {
      ADVANCED: <Zap size={12} />,
      EXPERT: <Trophy size={12} />,
      BEGINNER: <Sparkles size={12} />,
      INTERMEDIATE: <TrendingUp size={12} />,
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${
          styles[level] || "bg-stone-700 text-stone-300 border-stone-600"
        }`}
      >
        {icons[level] || <Star size={12} />}{" "}
        {level ? level.charAt(0) + level.slice(1).toLowerCase() : "N/A"}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="rounded-2xl p-8 shadow-md mb-8 bg-card-main">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <div className="p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg bg-gradient-to-r from-rose-600 to-rose-800 transform hover:scale-105 transition-all duration-300">
                <Award size={90} className="text-stone-200" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-medium mb-2 tracking-tight">
                  My Skills & Competencies
                </h1>
                <p className="text-star-dust-400 text-1xl">
                  Showcase and manage your professional skills and proficiency.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 lg:mt-0">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-3 py-2 rounded-md font-medium transition-all duration-200 inline-flex items-center shadow-lg hover:shadow-xl text-[14px] bg-yellow-500 hover:scale-105 text-stone-700"
              >
                <RefreshCw
                  size={18}
                  className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <Link
                to="/my-skills/new"
                className="px-3 py-2 text-stone-200 text-[14px] rounded-md font-medium transition-all duration-200 inline-flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 bg-green-600"
              >
                <PlusCircle size={20} className="mr-2" />
                Add Skill
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card-main rounded-xl p-6 mb-8 shadow-lg">
          <h3 className="flex items-center text-slate-300 mb-4">
            <Filter size={15} className="mr-2" /> Filter Your Skills
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search your skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-none outline-none rounded-lg bg-card-sub"
              />
            </div>
            <select
              value={filterByCategory}
              onChange={(e) => setFilterByCategory(e.target.value)}
              className="w-full px-4 text-slate-400 border-none outline-none rounded-lg bg-card-sub appearance-none"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              onClick={resetFiltersHandler}
              className="px-4 py-2 duration-200 font-medium bg-blue-600 rounded-lg hover:scale-105 inline-flex items-center justify-center"
            >
              <RotateCcw size={16} className="mr-2" /> Reset
            </button>
          </div>
        </div>

        {/* Content Area */}
        {filteredSkills.length === 0 && !loading ? (
          <div className="bg-card-main rounded-xl p-12 text-center shadow-md border border-stone-700">
            <Award size={64} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-stone-300 mb-2">
              {searchTerm || filterByCategory !== "all"
                ? "No skills match your criteria"
                : "You haven't added any skills yet"}
            </h3>
            <p className="text-stone-400">
              Showcase your expertise by adding skills to your profile.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                className="bg-card-main shadow-md rounded-xl flex flex-col transition-all duration-300 hover:border-orange-500/50 hover:-translate-y-1"
              >
                <div className="p-5 flex-grow">
                  <div className="flex items-start justify-between mb-3">
                    <h3
                      className="text-lg font-semibold text-stone-200 flex items-center flex-1 min-w-0 pr-2"
                      title={skill.name}
                    >
                      <UserStar
                        size={30}
                        className="text-indigo-500 mr-3 flex-shrink-0"
                      />
                      <span className="truncate">{skill.name}</span>
                    </h3>
                    {getLevelPill(skill.level)}
                  </div>
                  <div className="flex items-center text-sm text-stone-400 mb-4">
                    {getCategoryIcon(skill.category)}
                    <span>
                      {skill.category
                        ? skill.category.replace(/_/g, " ")
                        : "No Category"}
                    </span>
                  </div>
                  <p
                    className="text-sm text-stone-400 h-16 overflow-y-auto"
                    title={skill.description}
                  >
                    {skill.description || (
                      <span className="italic">No description provided.</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {loading && !refreshing && <LoadingIndicator />}
    </div>
  );
};

export default MySkillsPage;
