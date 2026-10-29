import type { ReactNode } from 'react';
import { NavLink, type NavLinkProps } from 'react-router';

interface NavButtonProps extends Omit<NavLinkProps, 'children'> {
    icon: ReactNode;
    label?: string;
};

function NavButton({ icon, label, ...props }: NavButtonProps) {
    return (
        <NavLink
            {...props}
            className={({ isActive }) =>
                `flex flex-col items-center gap-1 ${isActive ? 'font-semibold' : 'opacity-70'}`
            }
        >
            {icon}
            {label && <span className='text-xs'>{label}</span>}
        </NavLink>
    );
}

export default NavButton;