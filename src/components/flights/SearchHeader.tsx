'use client';

import { motion } from 'framer-motion';

export function SearchHeader() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Flight Search Results
      </h1>
      <p className="text-gray-600 mb-8">
        Browse through our available flights and find the perfect one for your journey
      </p>
    </motion.div>
  );
}