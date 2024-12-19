import React, { useRef, useEffect } from 'react';
import OrderForm from './OrderForm';
import { useMenu } from '../context/MenuContext';
import VanillaTilt from 'vanilla-tilt';
import * as firestoreService from '../services/firestore';

interface OrderFormData {
  name: string;
  contactNumber?: string;
  email?: string;
  orderChoice: string;
  totalPrice: number;
  paymentMethod: 'cash' | 'online' | 'cutoff';
}

const HomePage: React.FC = () => {
  const { state: { menuItems } } = useMenu();
  const formRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formRef.current) {
      VanillaTilt.init(formRef.current, {
        max: 1.5,
        speed: 400,
        glare: false,
        scale: 1.01,
        perspective: 2000,
        transition: true,
        gyroscope: false
      });
    }

    if (headerRef.current) {
      VanillaTilt.init(headerRef.current, {
        max: 2,
        speed: 200,
        scale: 1.01,
        perspective: 1500,
        transition: true,
        gyroscope: false
      });
    }

    return () => {
      if (formRef.current) {
        // @ts-ignore
        formRef.current.vanillaTilt?.destroy();
      }
      if (headerRef.current) {
        // @ts-ignore
        headerRef.current.vanillaTilt?.destroy();
      }
    };
  }, []);

  const handleOrderSubmit = async (orderData: OrderFormData) => {
    try {
      await firestoreService.addOrder({
        ...orderData,
        status: 'pending',
        isPaid: false,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 transform transition-transform duration-1000 ease-out"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1.1)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
      </div>

      <div className="fixed inset-0 z-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white/10 animate-float"
            style={{
              width: Math.random() * 100 + 50 + 'px',
              height: Math.random() * 100 + 50 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <header 
          ref={headerRef}
          className="relative bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 text-white py-3 shadow-lg"
          data-tilt-reverse="true"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
          </div>
          <div className="container mx-auto px-4 relative">
            <div className="flex justify-center items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-full p-0.5 shadow-lg transform hover:scale-105 transition-transform duration-200 overflow-hidden">
                  <img 
                    src="/Haveekos logo.jpg"
                    alt="Haveekos"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-shadow-lg leading-tight">
                    Welcome to HAVEEKO's
                  </h1>
                  <p className="text-sm text-white/90 font-medium">
                    See you at 7th flr locker room 😊
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div 
              ref={formRef}
              className="bg-white rounded-lg p-8 shadow-xl"
              data-tilt
            >
              <OrderForm onSubmit={handleOrderSubmit} menuItems={menuItems} />
            </div>
          </div>
        </div>

        <footer className="relative bg-gray-900/95 text-white py-1 mt-auto border-t border-white/10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} HAVEEKO's Food Ordering. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;