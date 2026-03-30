import ScrollImageSpreadSection from '../components/in-house-planner/ScrollImageSpreadSection'
import GrandCelebrationsSection from '../components/in-house-planner/GrandCelebrationsSection'
import CelebrationsEveryDaySection from '../components/in-house-planner/CelebrationsEveryDaySection'
import CelebrationFormSection from '../components/in-house-planner/CelebrationFormSection'

import plannerImg from '../assets/images/moksha_portrait.jpg'

const InHousePlannerSection = () => {
  return (
    <>
      <ScrollImageSpreadSection />

      <section className="w-full bg-[#957960] flex justify-center font-sans">
        <div className="w-full max-w-[1440px] flex flex-col min-[540px]:flex-row">
          {/* Image */}
          <div className="w-full min-[540px]:w-1/2 h-[clamp(380px,62vh,520px)] min-[540px]:h-[670px] overflow-hidden">
            <img
              src={plannerImg}
              alt="Moksha - In-House Event Planner"
              className="w-full h-full object-cover object-[center_20%] min-[540px]:object-[center_top] scale-[1.18] min-[540px]:scale-[1.00] origin-[50%_18%] min-[540px]:origin-top"
            />
          </div>

          {/* Content */}
          <div className="w-full min-[540px]:w-1/2 flex flex-col justify-center px-6 py-8 min-[540px]:px-12 min-[540px]:py-0 text-white">
            {/* Heading */}
            <h2
              className="text-[32px] min-[540px]:text-[61px] leading-tight font-serif mb-4"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              From Our In-House <br /> Event Planner
            </h2>

            {/* Subheading */}
            <h3 className="text-[18px] min-[540px]:text-[21px] font-medium mb-4">
              Hi, I&apos;m Moksha.
            </h3>

            {/* Paragraphs */}
            <p className="opacity-80 text-[14px] min-[540px]:text-[16px] leading-relaxed mb-4">
              Co-founder at Elewen and a professional event planner with 6+ years of industry
              experience. Trained in International Events in the UK, I bring structure, creativity,
              and calm to every celebration.
            </p>

            <p className="opacity-80 text-[14px] min-[540px]:text-[16px] leading-relaxed">
              Some events call for personal attention and thoughtful detailing. They need intention,
              detail, and a planner who truly cares, that&apos;s exactly why the In-House Planner
              was created.
            </p>
          </div>
        </div>
      </section>

      <GrandCelebrationsSection />

      <CelebrationsEveryDaySection />

      <CelebrationFormSection />
    </>
  )
}

export default InHousePlannerSection
