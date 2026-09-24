'use client';

import Link from 'next/link';
import { Autoplay, Keyboard, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import type { HomeData } from '@/lib/types';

/** autoplay 5s, หยุดเมื่อ hover, swipe/keyboard ได้ (01-PRD FR-12..14) */
export default function HeroSlider({ sliders }: { sliders: HomeData['sliders'] }) {
  if (!sliders.length) return <div className="ae-card aspect-[2.5/1]" />;
  return (
    <Swiper
      className="hero-swiper aspect-[2.5/1] w-full overflow-hidden rounded-card"
      modules={[Autoplay, Navigation, Pagination, Keyboard]}
      autoplay={{ delay: 5000, pauseOnMouseEnter: true, disableOnInteraction: false }}
      navigation
      pagination={{ clickable: true }}
      keyboard
      loop={sliders.length > 1}
      speed={500}
      a11y={{ prevSlideMessage: 'สไลด์ก่อนหน้า', nextSlideMessage: 'สไลด์ถัดไป' }}
    >
      {sliders.map((s, i) => (
        <SwiperSlide key={s.id}>
          <Link href={s.link}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt={`สไลด์ ${i + 1}`} className="h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} />
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
