import { useState } from 'react';

const testimonialsData = [
  {
    id: 0,
    category: "Corporate Event • Venue Decor",
    text: "The team went above and beyond. Our annual summit looked spectacular, and the attention to detail was flawless.",
    author: "Aditi Sharma",
    stars: 5
  },
  {
    id: 1,
    category: "Birthday Party • House party Décor",
    text: "Booked my 28th birthday party décor through Elewen and felt completely at ease. Everything was delivered home, set up on time, and I didn't have to manage a thing.",
    author: "Bhomick Kukreja",
    stars: 5
  },
  {
    id: 2,
    category: "Anniversary Dinner • Intimate Setup",
    text: "Created the most magical evening for our 10th anniversary. The floral arrangements and lighting were breathtaking.",
    author: "Rahul Verma",
    stars: 5
  },
  {
    id: 3,
    category: "Baby Shower • Theme Styling",
    text: "Absolutely beautiful pastel setup. The guests couldn't stop taking pictures, and the whole process was so smooth.",
    author: "Priya Patel",
    stars: 5
  }
];

const StarRating = ({ count }) => {
  return (
    <div className="flex gap-2">
      {[...Array(count)].map((_, i) => (
        <svg key={i} width="28" height="26" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0L17.1432 9.67376H27.3148L19.0858 15.6525L22.229 25.3262L14 19.3475L5.77101 25.3262L8.9142 15.6525L0.685208 9.67376H10.8568L14 0Z" fill="#CDB17E"/>
        </svg>
      ))}
    </div>
  );
};

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(1);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonialsData.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? testimonialsData.length - 1 : prev - 1));
  };

  return (
    <section className="relative w-full h-[757px] bg-[#364022] overflow-hidden font-sans flex flex-col items-center">
      
      {/* --- Heading --- */}
      <h2 
        className="text-[#FFFFFF] text-[61px] leading-[1] text-center font-serif mt-[80px] z-10"
        style={{ fontFamily: "'Malgin', serif" }}
      >
        Real Celebrations. Real Experiences.
      </h2>

      {/* --- Carousel Container --- */}
      <div className="relative w-full max-w-[1440px] h-[368px] mt-[80px] flex justify-center items-center overflow-hidden">
        
        {testimonialsData.map((item, index) => {
          let position = index - activeIndex;
          const n = testimonialsData.length;
          // Normalize position for infinite loop (keep in range -2 to 2 for smooth sliding)
          while (position > 2) position -= n;
          while (position < -2) position += n;

          const isActive = position === 0;
          const translateX = position * 480;
          
          return (
            <div 
              key={item.id}
              className={`absolute transition-all duration-500 ease-in-out bg-[#FFFFFF] rounded-[12px] p-8 flex flex-col justify-between cursor-pointer
                ${isActive 
                  ? 'w-[517px] h-[368px] opacity-100 z-20 shadow-xl scale-100' 
                  : 'w-[414px] h-[294px] opacity-80 z-10 scale-[0.9] pointer-events-none'
                }
              `}
              style={{
                transform: `translateX(${translateX}px)`,
              }}
              onClick={() => !isActive && setActiveIndex(index)}
            >
              <div>
                <StarRating count={item.stars} />
                
                <p className={`text-[#787575] font-normal font-sans mt-4 ${isActive ? 'text-[16px]' : 'text-[13px]'}`}>
                  {item.category}
                </p>
                
                <p className={`text-[#2D2D2D] font-normal font-sans mt-6 leading-[1.2] ${isActive ? 'text-[21px]' : 'text-[17px]'}`}>
                  "{item.text}"
                </p>
              </div>

              <p className={`text-[#787575] font-medium font-sans mt-4 ${isActive ? 'text-[21px]' : 'text-[17px]'}`}>
                {item.author}
              </p>
            </div>
          );
        })}

      </div>

      {/* --- Controls --- */}
      <div className="w-[611px] max-w-[90vw] h-[48px] mt-[40px] flex justify-between items-center gap-[25px] z-20">
        
        <button 
          onClick={handlePrev}
          className="w-[48px] h-[48px] bg-[#CDB17E] rounded-[96px] flex items-center justify-center hover:bg-[#bfa06b] transition-colors shrink-0"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex items-center gap-[4px] w-[100px] h-[8px] justify-center">
          {testimonialsData.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-[8px] rounded-[8px] transition-all duration-300 ${activeIndex === idx ? 'w-[52px] bg-[#CDB17E]' : 'w-[8px] bg-[#C8C8C8]'}`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-[48px] h-[48px] bg-[#CDB17E] rounded-[96px] flex items-center justify-center hover:bg-[#bfa06b] transition-colors shrink-0"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

      </div>

    </section>
  );
};

export default TestimonialsSection;
