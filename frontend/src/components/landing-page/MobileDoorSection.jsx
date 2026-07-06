import CelebrationDoor from './CelebrationDoor'

export default function MobileDoorSection() {
  return (
    <div className="mobile-door-wrapper md:hidden">
      {/* Door dome with beige background inside */}
      <div className="mobile-door-container">
        <div className="mobile-door-dome bg-[#F6D69D]">
          <div className="mobile-door-inner">
            <CelebrationDoor className="mobile-door-svg" preserveAspectRatio="xMidYMid slice" />
          </div>
        </div>
        {/* Platform base */}
        <div className="mobile-door-platform bg-[#F6D69D]"></div>
      </div>
    </div>
  )
}
