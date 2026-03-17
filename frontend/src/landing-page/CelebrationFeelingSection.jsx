import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import img1 from './images/img2017.jpg';
import img2 from './images/img3001.jpg';
import img3 from './images/img3010.jpg';
import img4 from './images/img8f9e.jpg';
import img5 from './images/img6a98.jpg';

const CelebrationFeelingSection = () => {
  const containerRef = useRef(null);

  // Tracks scroll progress relative to this specific section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Define different movement speeds for each image (Parallax)
  // Negative values move up, positive move down
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]); // Fast up
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -80]);  // Slow up
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -120]); // Medium up
  const y4 = useTransform(scrollYProgress, [0, 1], [0, -60]);  // Very slow up
  const y5 = useTransform(scrollYProgress, [0, 1], [0, -200]); // Very fast up

  const imageShadow = '-54px 121px 37px rgba(0, 0, 0, 0.01), -34px 77px 34px rgba(0, 0, 0, 0.04), -19px 43px 29px rgba(0, 0, 0, 0.14), -9px 19px 21px rgba(0, 0, 0, 0.24), -2px 5px 12px rgba(0, 0, 0, 0.28)';

  return (
    <section 
      ref={containerRef}
      className="w-full bg-[#BFAC9B] overflow-hidden flex justify-center font-sans relative h-[900px]"
    >
      <div className="relative w-[1440px] max-w-full h-full shrink-0">
        
        {/* Top Left Image - Fast */}
        <motion.img 
          style={{ y: y1, boxShadow: imageShadow }}
          src={img1} 
          alt="Event Decor" 
          className="absolute left-[0px] top-[100px] w-[347px] h-[280px] object-cover pointer-events-none z-0"
        />

        {/* Bottom Left Image - Slow */}
        <motion.img 
          style={{ y: y2, boxShadow: imageShadow }}
          src={img2} 
          alt="Event Decor" 
          className="absolute left-[42px] top-[450px] w-[249px] h-[375px] object-cover pointer-events-none z-0"
        />

        {/* Bottom Center Image - Medium */}
        <motion.img 
          style={{ y: y3, boxShadow: imageShadow }}
          src={img3} 
          alt="Event Decor" 
          className="absolute left-[497px] top-[700px] w-[290px] h-[316px] object-cover pointer-events-none z-0"
        />

        {/* Bottom Right Image - Slow */}
        <motion.img 
          style={{ y: y4, boxShadow: imageShadow }}
          src={img4} 
          alt="Event Decor" 
          className="absolute left-[1034px] top-[400px] w-[312px] h-[318px] object-cover pointer-events-none z-0"
        />

        {/* Top Right Image - Very Fast */}
        <motion.img 
          style={{ y: y5, boxShadow: imageShadow }}
          src={img5} 
          alt="Event Decor" 
          className="absolute left-[909px] top-[50px] w-[505px] h-[265px] object-cover pointer-events-none z-0"
        />

        {/* Content Stays Centered */}
        <div className="sticky top-[250px] z-10 flex flex-col items-center">
            <h2 
            className="w-[1148px] max-w-[calc(100%-2rem)] text-[#FFFFFF] text-[48px] md:text-[96px] leading-[0.9] text-center font-serif drop-shadow-sm px-4"
            style={{ fontFamily: "'Malgin', serif" }}
            >
            Every celebration <br /> deserves its own feeling.
            </h2>

            <p className="mt-8 w-[522px] max-w-[calc(100%-2rem)] text-[#FFFFFF] text-[14px] md:text-[16px] leading-[1.5] text-center drop-shadow-sm px-4">
            Want a professional to handle your event end to end? Fill the form and let our in-house planners plan it with you.
            </p>

            <button className="mt-10 w-[213px] h-[44px] group flex items-center justify-between bg-[#FFFFFF] rounded-[56px] pl-[24px] pr-[4px] py-[4px] hover:bg-[#F2F2F2] transition-colors shadow-lg">
            <span className="text-[#CDB17E] text-[16px] font-medium leading-[1.5] tracking-wide">
                Plan with Elewen
            </span>
            <div className="w-[36px] h-[36px] bg-[#CDB17E] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border-[1.5px] border-[#FFFFFF]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                </svg>
            </div>
            </button>
        </div>

      </div>
    </section>
  );
};

export default CelebrationFeelingSection;
