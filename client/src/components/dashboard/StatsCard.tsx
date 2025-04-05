interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  let bgColorClass: string;
  let textColorClass: string;
  
  switch (color) {
    case 'blue':
      bgColorClass = 'bg-blue-100';
      textColorClass = 'text-blue-500';
      break;
    case 'green':
      bgColorClass = 'bg-green-100';
      textColorClass = 'text-green-500';
      break;
    case 'purple':
      bgColorClass = 'bg-purple-100';
      textColorClass = 'text-purple-500';
      break;
    case 'yellow':
      bgColorClass = 'bg-yellow-100';
      textColorClass = 'text-yellow-500';
      break;
    default:
      bgColorClass = 'bg-gray-100';
      textColorClass = 'text-gray-500';
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${bgColorClass} ${textColorClass} mr-4`}>
          <i className={`${icon} text-xl`}></i>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
