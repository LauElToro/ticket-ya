import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSlider from '@/components/home/HeroSlider';
import SearchBar from '@/components/home/SearchBar';
import Categories from '@/components/home/Categories';
import FeaturedEvents from '@/components/home/FeaturedEvents';
import HowItWorks from '@/components/home/HowItWorks';
import PaymentMethods from '@/components/home/PaymentMethods';

const Index = () => {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header />
      
      <main>
        <HeroSlider />
        <Categories />
        <FeaturedEvents />
        <HowItWorks />
        <PaymentMethods />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
