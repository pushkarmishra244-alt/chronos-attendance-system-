import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onGetStarted?: () => void;
}

export default function Navbar({ onGetStarted }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'service', href: '#service' },
    { name: 'patient resources', href: '#resources' },
    { name: 'about us', href: '#about' },
    { name: 'education center', href: '#education' }
  ];

  return (
    <>
      <nav id="landing-navbar" className="fixed top-0 left-0 w-full z-150 py-6 md:py-10 bg-gradient-to-b from-[#f1f1f1]/80 to-transparent backdrop-blur-[2px]">
        <div className="grid grid-cols-12 max-w-7xl mx-auto px-6 md:px-12 items-center w-full">
          
          {/* Left: Clover Icon and brand (Cols 1-3) */}
          <div className="col-span-6 md:col-span-3 flex items-center gap-2">
            <svg 
              className="w-7 h-7" 
              viewBox="0 0 24 24" 
              fill="#1a1a1a" 
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Clover icon"
            >
              {/* 4-leaf geometric clover / flower */}
              <circle cx="12" cy="7.5" r="3.5" />
              <circle cx="12" cy="16.5" r="3.5" />
              <circle cx="7.5" cy="12" r="3.5" />
              <circle cx="16.5" cy="12" r="3.5" />
              <circle cx="12" cy="12" r="1.5" fill="#f1f1f1" />
            </svg>
            <span className="font-display font-medium text-lg md:text-xl tracking-tight text-[#1a1a1a]">
              mėntality
            </span>
          </div>

          {/* Center (Cols 4-9): Desktop nav links */}
          <div className="hidden md:flex col-span-6 items-center justify-center gap-8 lg:gap-12">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-sans text-zinc-650 hover:text-black transition-colors lowercase tracking-wide font-medium"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right (Cols 10-12): find help, get started, hamburger toggle */}
          <div className="col-span-6 md:col-span-3 flex items-center justify-end gap-4 md:gap-6">
            <a 
              href="#help" 
              className="hidden sm:inline-block text-xs text-zinc-650 hover:text-black transition-colors lowercase font-medium tracking-wide"
            >
              find help
            </a>
            
            <button
              onClick={onGetStarted}
              className="hidden sm:inline-flex items-center justify-center bg-[#1a1a1a] text-white hover:bg-neutral-800 transition-all rounded-full px-5 py-2.5 text-xs font-display font-medium tracking-wide shadow-sm cursor-pointer"
            >
              get started &rarr;
            </button>

            {/* Elegant hamburger menu toggle for mobile */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-[#1a1a1a] md:hidden hover:bg-[#1a1a1a]/5 rounded-md transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile slide-down navigation drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="fixed top-[76px] left-0 w-full bg-[#f1f1f1]/95 backdrop-blur-md z-45 border-b border-black/[0.05] shadow-lg overflow-hidden md:hidden"
          >
            <div className="flex flex-col px-6 py-8 gap-5">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-sans text-zinc-700 hover:text-black transition-colors lowercase tracking-wide font-medium border-b border-black/[0.03] pb-2"
                >
                  {link.name}
                </a>
              ))}
              
              <div className="flex flex-col gap-4 mt-2">
                <a 
                  href="#help" 
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-zinc-700 hover:text-black transition-colors lowercase font-medium tracking-wide"
                >
                  find help
                </a>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (onGetStarted) onGetStarted();
                  }}
                  className="w-full bg-[#1a1a1a] text-white py-3 rounded-full text-xs font-display font-medium tracking-wide text-center cursor-pointer shadow-sm"
                >
                  get started &rarr;
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
