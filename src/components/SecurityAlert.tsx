import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SecurityEvent {
  id: string;
  event_type: string;
  email: string | null;
  ip_address: unknown;
  user_agent: string | null;
  user_id: string | null;
  details: any;
  created_at: string;
}

interface SecurityAlertProps {
  isAdmin?: boolean;
}

export default function SecurityAlert({ isAdmin = false }: SecurityAlertProps) {
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchRecentSecurityEvents();
    }
  }, [isAdmin]);

  const fetchRecentSecurityEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentEvents((data || []) as SecurityEvent[]);
    } catch (error) {
      console.error('Error fetching security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'failed_login':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'successful_login':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'suspicious_activity':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Shield className="w-4 h-4 text-primary" />;
    }
  };

  const getEventSeverity = (eventType: string) => {
    const highSeverity = ['failed_login', 'suspicious_activity', 'account_lockout'];
    return highSeverity.includes(eventType) ? 'high' : 'low';
  };

  const formatEventTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isAdmin) {
    return null;
  }

  const highSeverityEvents = recentEvents.filter(event => 
    getEventSeverity(event.event_type) === 'high'
  );

  return (
    <Card className="esports-card mb-6">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-text-primary">System Status</span>
            </div>
            <p className="text-xs text-text-secondary">All security measures active</p>
          </div>
          
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium text-text-primary">Recent Alerts</span>
            </div>
            <p className="text-xs text-text-secondary">{highSeverityEvents.length} high-priority events</p>
          </div>
          
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-text-primary">Protection Level</span>
            </div>
            <p className="text-xs text-text-secondary">Enhanced security enabled</p>
          </div>
        </div>

        {/* High Priority Alerts */}
        {highSeverityEvents.length > 0 && (
          <Alert className="border-warning/20 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Security Alerts</AlertTitle>
            <AlertDescription className="text-text-secondary">
              {highSeverityEvents.length} high-priority security events detected in the last 24 hours.
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Events */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-text-primary">Recent Security Events</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-6 px-2"
            >
              <Eye className="w-3 h-3 mr-1" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-secondary/50 rounded"></div>
              ))}
            </div>
          ) : recentEvents.length > 0 ? (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {recentEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 text-xs"
                >
                  {getEventIcon(event.event_type)}
                  <div className="flex-1 min-w-0">
                    <span className="text-text-primary font-medium">
                      {event.event_type.replace('_', ' ').toUpperCase()}
                    </span>
                    {event.email && (
                      <span className="text-text-secondary ml-2">({event.email})</span>
                    )}
                  </div>
                  <span className="text-text-muted whitespace-nowrap">
                    {formatEventTime(event.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-xs">No recent security events</p>
          )}
        </div>

        {/* Security Recommendations */}
        <Alert className="border-primary/20 bg-primary/10">
          <Shield className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Security Recommendations</AlertTitle>
          <AlertDescription className="text-text-secondary text-xs space-y-1">
            <div>• Enable leaked password protection in Supabase Auth settings</div>
            <div>• Upgrade PostgreSQL to apply latest security patches</div>
            <div>• Review admin access logs monthly</div>
            <div>• Monitor for unusual login patterns</div>
          </AlertDescription>
        </Alert>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecentSecurityEvents}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Refreshing...' : 'Refresh Security Status'}
        </Button>
      </CardContent>
    </Card>
  );
}