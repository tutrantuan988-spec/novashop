import { memo } from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

function MotionWrapper({ children, className = '', variant = 'fadeUp', delay = 0, ...props }) {
  const variants = { fadeUp, fadeIn, stagger };
  const selected = variants[variant] || fadeUp;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={selected}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({ children, className = '' }) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}

export default memo(MotionWrapper);
