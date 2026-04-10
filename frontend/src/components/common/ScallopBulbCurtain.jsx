import bulb1 from '../../assets/lightbulb_images/bulb1.png'
import bulb2 from '../../assets/lightbulb_images/bulb2.png'

export default function ScallopBulbCurtain({
  count = 15,
  outerColor = '#CDB17E',
  innerColor = '#591902',
  wireColorClass = 'bg-[#591902]/40',
  className = 'absolute -top-px md:top-0 left-1/2 -translate-x-1/2 w-max flex pointer-events-none z-10',
  showBulbs = true,
  fitToWidth = false,
}) {
  const scallopCount = Array.from({ length: count })
  const itemClass = fitToWidth
    ? 'relative min-w-0 flex-1 h-[34px] md:h-[76px]'
    : 'relative shrink-0 w-[60px] h-[34px] md:w-[136px] md:h-[76px]'
  const outerArcClass = fitToWidth
    ? 'absolute inset-x-0 top-0 h-[34px] md:h-[76px]'
    : 'absolute top-0 left-0 w-[60px] h-[34px] md:w-[136px] md:h-[76px]'
  const innerArcClass = fitToWidth
    ? 'absolute inset-x-0 top-0 h-[34px] md:h-[61px]'
    : 'absolute top-0 left-0 w-[60px] h-[34px] md:w-[136px] md:h-[61px]'

  return (
    <div className={className}>
      {scallopCount.map((_, i) => (
        <div key={i} className={itemClass}>
          <div
            className={outerArcClass}
            style={{
              backgroundColor: outerColor,
              borderRadius: '0 0 50% 50% / 0 0 100% 100%',
            }}
          />
          <div
            className={innerArcClass}
            style={{
              backgroundColor: innerColor,
              borderRadius: '0 0 50% 50% / 0 0 100% 100%',
            }}
          />

          {showBulbs && i !== scallopCount.length - 1 && (
            <div
              className="absolute top-0 right-0 flex flex-col items-center z-20 animate-swing"
              style={{
                animationDuration: `${3.5 + (i % 3) * 0.5}s`,
                animationDelay: `${(i % 5) * 0.2}s`,
              }}
            >
              <div className={`w-[1px] h-[10px] md:h-[14px] ${wireColorClass}`} />
              <div className="relative flex flex-col items-center -mt-3 md:-mt-4">
                <img
                  src={i % 2 === 0 ? bulb1 : bulb2}
                  alt="Light"
                  className="w-[20px] md:w-[32px] h-auto relative z-10"
                  loading="lazy"
                />
                <div
                  className={`absolute left-1/2 top-full -translate-y-1 md:-translate-y-2 w-[44px] h-[44px] opacity-40 pointer-events-none animate-beam ${
                    i % 2 === 0
                      ? 'md:w-[76px] md:h-[78px] blur-[6px] md:blur-[8px]'
                      : 'md:w-[76px] md:h-[59px] blur-[4px] md:blur-[4px]'
                  }`}
                  style={{
                    animationDuration: `${4 + (i % 3) * 0.75}s`,
                    animationDelay: `${(i % 5) * 0.2}s`,
                    background:
                      i % 2 === 0
                        ? 'linear-gradient(180deg, #FCD768 0%, rgba(247,247,245,0) 100%)'
                        : 'linear-gradient(180deg, #FCE6A4 -1.95%, rgba(247,247,245,0) 100%)',
                    clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0 100%)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
