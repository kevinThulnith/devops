import { useState, useEffect, useCallback, memo } from "react";
import { BsLayoutSidebarReverse } from "react-icons/bs";
import MenuItems from "../assets/MenuItems";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { FaUser } from "react-icons/fa";
import logo from "../assets/logo1.png";

const NavItem = memo(({ to, label, onClick, className, icon }) => (
  <NavLink to={to} className={className} onClick={onClick}>
    {label}
    {icon && icon}
  </NavLink>
));

const capitalizeGroupName = (name) => {
  return name.charAt(0).toUpperCase() + name.slice(1);
};

function Navbar() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);

  useEffect(() => {
    const checkWindowSize = () => {
      if (window.innerWidth >= 1024) setIsMenuOpen(true);
      else setIsMenuOpen(false);
    };

    // Check on initial render
    checkWindowSize();
    window.addEventListener("resize", checkWindowSize);
    return () => window.removeEventListener("resize", checkWindowSize);
  }, []);

  // Setup nav link classes
  const getNavLinkClass = useCallback(
    ({ isActive }) => `
     flex text-star-dust-200 mb-2 py-1 rounded-md text-[14px] mr-[-4px] hover:bg-stone-100 hover:text-stone-900 font-medium pl-2  ${
       isActive ? "bg-stone-100 text-stone-900" : ""
     }
  `,
    []
  );

  // Updated closeMenu to only close on smaller screens
  const closeMenu = useCallback(() => {
    if (window.innerWidth < 1024) {
      setIsMenuOpen(false);
    }
  }, []);

  // Function to filter menu items based on user role
  const filterMenuItemsByRole = useCallback(
    (items) => {
      if (!user || !user.role) return [];
      return items.filter((item) => item.roles.includes(user.role));
    },
    [user]
  );

  return (
    <>
      <div className="fixed top-0 left-0 z-50 bg-card-main shadow-md w-full h-14 flex items-center">
        <div className="md:container md:mx-auto mx-4 flex justify-between items-center w-full">
          <NavLink
            to="/"
            style={{
              fontWeight: 500,
              fontSize: "22px",
              letterSpacing: "0.5px",
            }}
            className="flex text-[#eeeade] items-center p-0.2 px-2 rounded-lg hover:bg-card-accent hover:text-white transition-colors"
          >
            <img className="h-5 mr-3" src={logo} alt="Logo" />
            <span>KY Biscuits</span>
          </NavLink>

          <div className="flex items-center gap-4">
            {/* Profile Indicator */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#5a5a5a] flex items-center justify-center">
                  <FaUser className="text-stone-200 text-1xl" />
                </div>
                <span className="hidden sm:block text-star-dust-200 capitalize text-[18px]">
                  {user.username}
                </span>
              </div>
            )}

            {/* Menu button */}
            <div className="lg:hidden" onClick={toggleMenu}>
              <BsLayoutSidebarReverse className="text-stone-200 text-xl cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
          style={{ top: "3.5rem" }}
        />
      )}

      {/* Side bar */}
      <div
        className={`
            fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-full sm:w-80 bg-card-main shadow-2xl
            transform transition-transform duration-300 ease-in-out
            ${isMenuOpen ? "translate-x-0" : "translate-x-full"}
            flex flex-col p-4 z-50 
          `}
      >
        {/* Scrollable section */}
        <div className="flex-grow overflow-y-auto mb-4 pr-1">
          {/* Render menu items grouped by category */}
          {Object.entries(MenuItems).map(([group, items]) => {
            // Filter items by user role
            const filteredItems = filterMenuItemsByRole(items);

            // Skip rendering groups with no visible items
            if (filteredItems.length === 0) return null;

            return (
              <div key={group} className="mb-4">
                <h3 className="text-stone-400 font-semibold mb-2 pb-1 text-[14px]">
                  {capitalizeGroupName(group)}
                </h3>
                <div>
                  {filteredItems.map((item) => (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={closeMenu}
                      className={getNavLinkClass}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Fixed section */}
        <div className="border-t border-stone-500 pt-2 mt-auto">
          <NavItem
            to="/logout"
            label="Logout"
            className={getNavLinkClass}
            onClick={closeMenu}
          />
        </div>
      </div>
    </>
  );
}

export default Navbar;
