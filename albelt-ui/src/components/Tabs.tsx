import React from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import './Tabs.css';

interface TabItem {
  label: string;
  icon?: string;
  content: React.ReactNode;
  id?: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
}

export function Tabs({ tabs, activeIndex = 0, onTabChange, className = '' }: TabsProps) {
  return (
    <div className={`albel-tabs-container ${className}`}>
      <TabView 
        activeIndex={activeIndex} 
        onTabChange={(e) => onTabChange?.(e.index)}
        className="custom-tabview"
      >
        {tabs.map((tab, index) => (
          <TabPanel 
            key={tab.id || index} 
            header={tab.label} 
            leftIcon={tab.icon ? `pi ${tab.icon} mr-2` : undefined}
          >
            <div className="tab-content-wrapper">
              {tab.content}
            </div>
          </TabPanel>
        ))}
      </TabView>
    </div>
  );
}
