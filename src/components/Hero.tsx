import React from 'react';
import { motion } from 'motion/react';

interface HeroProps {
  onSearchSubmit?: (query: string) => void;
  onGetStarted?: () => void;
}

export default function Hero({ onSearchSubmit, onGetStarted }: HeroProps) {
  const [searchVal, setSearchVal] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchVal.trim() && onSearchSubmit) {
        onSearchSubmit(searchVal);
      }
    }
  };

  return (
    <section className="relative min-h-[110vh] sm:min-h-[140vh] w-full flex flex-col items-center justify-start overflow-hidden bg-bg-base">
      
      {/* Background Video Container */}
      <div className="absolute top-[15vh] sm:top-[20vh] left-0 w-full h-[95vh] sm:h-[120vh] z-0 pointer-events-none">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-100"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260603_132049_036591b8-6e92-4760-b94c-a7ea6eef315c.mp4"
        />
        {/* Gradient Mask to smoothly blend the video into the background */}
        <div className="absolute top-0 left-0 w-full h-24 sm:h-32 bg-gradient-to-b from-[#EDEEF5] to-transparent"></div>
        {/* Bottom smooth fade to avoid sharp video end */}
        <div className="absolute bottom-0 left-0 w-full h-24 sm:h-32 bg-gradient-to-t from-[#EDEEF5] to-transparent"></div>
      </div>

      {/* Hero Content Alignment */}
      <div className="max-w-7xl w-full mx-auto px-8 md:px-16 lg:px-20 relative z-10 grid grid-cols-12 gap-x-4 md:gap-x-8">
        <div className="col-span-12 md:col-span-10 md:col-start-2 flex flex-col items-start pt-[22vh] sm:pt-[26vh]">
          
          {/* Hero Header with slide-up fade */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-[2.5rem] sm:text-[4.5rem] lg:text-[5.5rem] leading-[1.08] font-medium tracking-tight whitespace-normal text-left"
          >
            <span className="text-[#1a1a1a] block">Remix: Mentality offers</span>
            <span className="text-[#8e8e8e] block sm:inline">information </span>
            <span className="text-[#8e8e8e] block sm:inline">and resources to help you manage</span>
            <span className="text-[#8e8e8e] block">
              your{' '}
              <span className="w-[32px] md:w-[48px] lg:w-[62px] h-[16px] md:h-[24px] lg:h-[30px] border-[2px] border-[#1a1a1a] rounded-full inline-flex items-center justify-center mx-1 bg-transparent align-middle">
                <span className="w-2 h-2 rounded-full bg-black"></span>
              </span>{' '}
              mental wellbeing.
            </span>
          </motion.h1>

          {/* Search Pill Component with delayed slide-up */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mt-8 sm:mt-12 max-w-lg w-full"
          >
            <div className="bg-white rounded-[6px] border border-black/[0.05] p-1 pl-4 flex items-center shadow-sm w-full transition-all focus-within:shadow-md focus-within:border-black/10">
              <input 
                type="text" 
                placeholder="Ask me anything..." 
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-[#1a1a1a] text-sm py-2 placeholder-black/35 font-sans"
              />
              <button 
                onClick={() => searchVal.trim() && onSearchSubmit && onSearchSubmit(searchVal)}
                className="bg-[#1a1a1a] text-white w-9 h-9 rounded-full relative flex items-center justify-center shrink-0 cursor-pointer hover:bg-neutral-800 transition-colors"
                aria-label="Submit inquiry"
              >
                {/* SVG chevron/arrow icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Absolute Middle Right Edge: Language Switcher */}
      <div className="absolute right-6 top-[50%] -translate-y-[50%] z-20 hidden md:block">
        <button 
          className="bg-white/40 hover:bg-white/60 text-zinc-800 backdrop-blur-md border border-white/50 shadow-sm rounded-full px-4 py-2 text-[10px] tracking-widest uppercase font-mono font-bold transition-all cursor-pointer"
          title="Switch language"
        >
          pl — en
        </button>
      </div>

      {/* Absolute Bottom Left Corner */}
      <div className="absolute bottom-10 left-8 md:left-16 z-20 text-[11px] font-mono tracking-widest text-[#1a1a1a]/50 uppercase select-none">
        2024
      </div>

      {/* Absolute Bottom Right Corner */}
      <div className="absolute bottom-10 right-8 md:right-16 z-20 text-[11px] font-mono tracking-widest text-[#1a1a1a]/50 uppercase text-right select-none">
        mental health tools
      </div>

    </section>
  );
}
