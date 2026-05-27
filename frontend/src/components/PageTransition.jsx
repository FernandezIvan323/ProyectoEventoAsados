import { motion } from 'framer-motion';

export function FadeIn({ children, delay = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
