import React, { useState } from 'react';
import { FaChevronDown, FaHeadset } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../../styles/FAQ.css';

const faqs = [
  {
    category: 'orders',
    question: "Where is my order?",
    answer: "You can check the live status of your shipment in the 'My Orders' section. Once shipped, we also send an SMS with the courier tracking ID."
  },
  {
    category: 'orders',
    question: "Can I modify my order after placing it?",
    answer: "Unfortunately, we cannot modify orders once they are processed. However, if you request cancellation within 1 hour of placing the order via Chat/Email, we might be able to help."
  },
  {
    category: 'returns',
    question: "What is the return policy?",
    answer: "We offer a 7-day no-questions-asked return policy. If you receive a defective or incorrect item, please log a return request from your dashboard immediately."
  },
  {
    category: 'returns',
    question: "When will I get my refund?",
    answer: "Once our courier picks up the return packet, the QC (Quality Check) happens within 24 hours. The refund is then processed immediately to your original source (3-5 days for banks)."
  },
  {
    category: 'payment',
    question: "Do you accept Cash on Delivery?",
    answer: "Yes, COD is available for most pin codes. However, digital payments (UPI/Cards) are preferred for contactless delivery."
  },
  {
    category: 'payment',
    question: "Is it safe to use my card?",
    answer: "Absolutely. All transactions are encrypted via industry-standard payment gateways. We do not store your card details on our servers."
  }
];

const HelpCenter = () => {
  const [filter, setFilter] = useState('all');
  const [activeIndex, setActiveIndex] = useState(null);

  // Filter Data
  const visibleFaqs = filter === 'all' ? faqs : faqs.filter(f => f.category === filter);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="container help-container">
      
      <div className="help-header">
        <h1>How can we help?</h1>
        <p>Find answers to common questions below.</p>
      </div>

      {/* Categories */}
      <div className="help-tabs">
        <button 
          className={`help-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => { setFilter('all'); setActiveIndex(null); }}
        >
          All
        </button>
        <button 
          className={`help-tab ${filter === 'orders' ? 'active' : ''}`}
          onClick={() => { setFilter('orders'); setActiveIndex(null); }}
        >
          Orders & Delivery
        </button>
        <button 
          className={`help-tab ${filter === 'returns' ? 'active' : ''}`}
          onClick={() => { setFilter('returns'); setActiveIndex(null); }}
        >
          Returns
        </button>
        <button 
          className={`help-tab ${filter === 'payment' ? 'active' : ''}`}
          onClick={() => { setFilter('payment'); setActiveIndex(null); }}
        >
          Payments
        </button>
      </div>

      {/* Accordion List */}
      <div>
        {visibleFaqs.map((faq, index) => (
          <div key={index} className="accordion-item">
            <div 
              className="accordion-header" 
              onClick={() => toggleAccordion(index)}
            >
              <span>{faq.question}</span>
              <FaChevronDown className={`arrow-icon ${activeIndex === index ? 'open' : ''}`} />
            </div>
            <div className={`accordion-body ${activeIndex === index ? 'open' : ''}`}>
              {faq.answer}
            </div>
          </div>
        ))}
      </div>

      <div className="help-footer">
        <FaHeadset size={30} style={{ marginBottom: '10px' }} />
        <p>Still need help?</p>
        <Link to="/contact" className="btn" style={{ marginTop: '10px' }}>
          Contact Support
        </Link>
      </div>

    </div>
  );
};

export default HelpCenter;